import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import type { NormalizedWebhookEvent, ChannelType } from '../types';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import {
  OMNICHANNEL_MODULE_OPTIONS,
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
    private readonly dataSource: DataSource,
    private readonly whatsappAdapter: WhatsAppAdapter,
    private readonly instagramAdapter: InstagramAdapter,
    @Optional()
    private readonly omnichannelGateway: OmnichannelGateway | null,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {
    this.appUrl = options?.appUrl ?? '';
    this.metaWebhookVerifyToken = options?.meta?.webhookVerifyToken ?? '';
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

    const result = await this.dataSource.transaction(async (manager) => {
      const conversationRepo = manager.getRepository(Conversation);
      const messageRepo = manager.getRepository(Message);

      let conversation = await conversationRepo.findOne({
        where: { channelConversationId: event.channelConversationId },
      });

      const isNewConversation = !conversation;

      if (!conversation) {
        conversation = conversationRepo.create({
          channel,
          channelConversationId: event.channelConversationId,
          contactIdentifier: event.contactIdentifier,
          contactName: event.contactName,
          status: 'open',
        });
        conversation = await conversationRepo.save(conversation);
        this.logger.log(`Created new conversation: ${conversation.id}`);
      }

      const message = messageRepo.create({
        conversation,
        conversationId: conversation.id,
        channelMessageId: event.message!.channelMessageId,
        direction: event.message!.direction,
        senderName: event.message!.senderName ?? null,
        contentType: event.message!.contentType,
        contentText: event.message!.contentText ?? null,
        contentMediaUrl: event.message!.contentMediaUrl ?? null,
        status: event.message!.direction === 'inbound' ? 'delivered' : 'sent',
        metadata: event.message!.metadata ?? null,
      });
      const savedMessage = await messageRepo.save(message);

      const newUnreadCount =
        event.message!.direction === 'inbound'
          ? (conversation.unreadCount ?? 0) + 1
          : conversation.unreadCount ?? 0;

      await conversationRepo.update(conversation.id, {
        lastMessageAt: event.message!.timestamp,
        lastMessagePreview:
          event.message!.contentText?.substring(0, 100) ?? '[미디어]',
        unreadCount: newUnreadCount,
      });

      const updatedConversation = await conversationRepo.findOne({
        where: { id: conversation.id },
      });

      this.logger.log(
        `Message saved: ${event.message!.channelMessageId} in conversation ${conversation.id}`,
      );

      return {
        conversation: updatedConversation!,
        message: savedMessage,
        isNewConversation,
      };
    });

    // WebSocket으로 실시간 알림 전송
    if (this.omnichannelGateway) {
      this.omnichannelGateway.emitNewMessage(result.conversation.id, result.message);
      this.omnichannelGateway.emitConversationUpdate(result.conversation);
    }
  }

  private async handleStatusUpdate(
    event: NormalizedWebhookEvent,
  ): Promise<void> {
    if (!event.status) return;

    await this.messageService.updateStatus(
      event.status.messageId,
      event.status.status,
    );

    this.logger.log(
      `Message status updated: ${event.status.messageId} -> ${event.status.status}`,
    );
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
