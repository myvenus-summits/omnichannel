import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import type { NormalizedWebhookEvent, ChannelType } from '../types';
import type { IConversation, IMessage, IConversationRepository, IMessageRepository } from '../interfaces';
import {
  OMNICHANNEL_MODULE_OPTIONS,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  type OmnichannelModuleOptions,
} from '../interfaces';
import type { InstagramWebhookDto } from '../dto/instagram-webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly appUrl: string;
  private readonly metaWebhookVerifyToken: string;

  constructor(
    @Optional()
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly options: OmnichannelModuleOptions | undefined,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    private readonly whatsappAdapter: WhatsAppAdapter,
    private readonly instagramAdapter: InstagramAdapter,
    private readonly omnichannelGateway: OmnichannelGateway,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {
    this.appUrl = options?.appUrl ?? '';
    this.metaWebhookVerifyToken = options?.meta?.webhookVerifyToken ?? '';
    
    // Gateway 주입 확인 로그
    if (!this.omnichannelGateway) {
      this.logger.error('⚠️ OmnichannelGateway was not injected! Real-time updates will NOT work.');
    } else {
      this.logger.log('✅ OmnichannelGateway successfully injected');
    }
  }

  async handleTwilioWebhook(payload: unknown): Promise<void> {
    this.logger.log('Processing Twilio webhook');

    const event = this.whatsappAdapter.parseWebhookPayload(payload);
    if (!event) {
      this.logger.warn('Could not parse Twilio webhook payload');
      return;
    }

    await this.processEvent(event, 'whatsapp');
  }

  async handleMetaWebhook(payload: unknown): Promise<void> {
    this.logger.log('Processing Meta webhook');

    const metaPayload = payload as { object?: string };

    // Determine if this is Instagram or Messenger webhook
    if (metaPayload.object === 'instagram') {
      await this.handleInstagramWebhook(payload as InstagramWebhookDto);
    } else {
      this.logger.warn(`Unsupported Meta webhook object type: ${metaPayload.object}`);
    }
  }

  async handleInstagramWebhook(payload: InstagramWebhookDto): Promise<void> {
    this.logger.log('Processing Instagram webhook');

    const event = this.instagramAdapter.parseWebhookPayload(payload);
    if (!event) {
      this.logger.warn('Could not parse Instagram webhook payload');
      return;
    }

    await this.processEvent(event, 'instagram');
  }

  verifyMetaWebhook(verifyToken: string, challenge: string): string | null {
    if (verifyToken === this.metaWebhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  private async processEvent(
    event: NormalizedWebhookEvent,
    channel: ChannelType,
  ): Promise<void> {
    switch (event.type) {
      case 'message':
        await this.handleMessageEvent(event, channel);
        break;
      case 'status_update':
        await this.handleStatusUpdate(event);
        break;
      case 'conversation_created':
        await this.handleConversationCreated(event, channel);
        break;
      default:
        this.logger.warn(`Unknown event type: ${String((event as { type: unknown }).type)}`);
    }
  }

  private async handleMessageEvent(
    event: NormalizedWebhookEvent,
    channel: ChannelType,
  ): Promise<void> {
    if (!event.message) return;

    // Find or create conversation
    let conversation = await this.conversationRepository.findByChannelConversationId(
      event.channelConversationId,
    );

    const isNewConversation = !conversation;

    if (!conversation) {
      conversation = await this.conversationRepository.create({
        channel,
        channelConversationId: event.channelConversationId,
        contactIdentifier: event.contactIdentifier,
        contactName: event.contactName ?? null,
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 0,
        lastMessageAt: null,
        lastMessagePreview: null,
        metadata: null,
      });
      this.logger.log(`Created new conversation: ${conversation.id}`);
    }

    // Check if message already exists
    const existingMessage = await this.messageRepository.findByChannelMessageId(
      event.message.channelMessageId,
    );

    if (existingMessage) {
      this.logger.log(`Message ${event.message.channelMessageId} already exists`);
      return;
    }

    // Create message
    const message = await this.messageRepository.create({
      conversationId: conversation.id,
      channelMessageId: event.message.channelMessageId,
      direction: event.message.direction,
      senderName: event.message.senderName ?? null,
      senderUserId: null,
      contentType: event.message.contentType,
      contentText: event.message.contentText ?? null,
      contentMediaUrl: event.message.contentMediaUrl ?? null,
      status: event.message.direction === 'inbound' ? 'delivered' : 'sent',
      metadata: event.message.metadata ?? null,
    });

    // Update conversation
    const newUnreadCount =
      event.message.direction === 'inbound'
        ? (conversation.unreadCount ?? 0) + 1
        : conversation.unreadCount ?? 0;

    const updatedConversation = await this.conversationRepository.update(conversation.id, {
      lastMessageAt: event.message.timestamp,
      lastMessagePreview: event.message.contentText?.substring(0, 100) ?? '[미디어]',
      unreadCount: newUnreadCount,
    });

    this.logger.log(
      `Message saved: ${event.message.channelMessageId} in conversation ${conversation.id}`,
    );

    // WebSocket으로 실시간 알림 전송
    this.logger.log(`🔔 Emitting WebSocket events for conversation ${updatedConversation.id}`);
    this.omnichannelGateway?.emitNewMessage(updatedConversation.id, message);
    this.omnichannelGateway?.emitConversationUpdate(updatedConversation);
  }

  private async handleStatusUpdate(
    event: NormalizedWebhookEvent,
  ): Promise<void> {
    if (!event.status) return;

    const { messageId, status } = event.status;

    // 메시지 상태 업데이트
    await this.messageService.updateStatus(messageId, status);

    this.logger.log(
      `Message status updated: ${messageId} -> ${status}`,
    );

    // 메시지 조회해서 conversationId 가져오기
    const message = await this.messageRepository.findByChannelMessageId(messageId);
    
    if (message && this.omnichannelGateway) {
      // WebSocket으로 상태 변경 브로드캐스트
      this.omnichannelGateway.emitMessageStatusUpdate(
        message.conversationId,
        messageId,
        status,
      );
      
      this.logger.log(
        `🔔 Broadcast message status update: ${messageId} -> ${status}`,
      );
    }
  }

  private async handleConversationCreated(
    event: NormalizedWebhookEvent,
    channel: ChannelType,
  ): Promise<void> {
    const existing = await this.conversationService.findByChannelConversationId(
      event.channelConversationId,
    );

    if (!existing) {
      await this.conversationService.create({
        channel,
        channelConversationId: event.channelConversationId,
        contactIdentifier: event.contactIdentifier,
        status: 'open',
      });
      this.logger.log(
        `Created conversation from webhook: ${event.channelConversationId}`,
      );
    }
  }
}
