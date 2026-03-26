import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import type { NormalizedWebhookEvent, ChannelType } from '../types';
import type { IConversation, IMessage, IConversationRepository, IMessageRepository, IContactChannelRepository, ResolvedChannelConfig } from '../interfaces';
import {
  OMNICHANNEL_MODULE_OPTIONS,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  CONTACT_CHANNEL_REPOSITORY,
  type OmnichannelModuleOptions,
} from '../interfaces';
import type { InstagramWebhookDto } from '../dto/instagram-webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly appUrl: string;
  private readonly metaWebhookVerifyToken: string;
  private readonly webhookChannelResolver: import('../interfaces').WebhookChannelResolver | null;
  private readonly mediaUrlTransformer: import('../interfaces').OmnichannelModuleOptions['mediaUrlTransformer'] | null;

  constructor(
    @Optional()
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly options: OmnichannelModuleOptions | undefined,
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Optional()
    @Inject(CONTACT_CHANNEL_REPOSITORY)
    private readonly contactChannelRepository: IContactChannelRepository | undefined,
    private readonly whatsappAdapter: WhatsAppAdapter,
    private readonly instagramAdapter: InstagramAdapter,
    private readonly omnichannelGateway: OmnichannelGateway,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {
    this.appUrl = options?.appUrl ?? '';
    this.metaWebhookVerifyToken = options?.meta?.webhookVerifyToken ?? '';
    this.webhookChannelResolver = options?.webhookChannelResolver ?? null;
    this.mediaUrlTransformer = options?.mediaUrlTransformer ?? null;
    
    // Gateway 주입 확인 로그
    if (!this.omnichannelGateway) {
      this.logger.error('⚠️ OmnichannelGateway was not injected! Real-time updates will NOT work.');
    } else {
      this.logger.log('✅ OmnichannelGateway successfully injected');
    }
  }

  async handleTwilioWebhook(
    payload: unknown,
    preResolvedConfig?: ResolvedChannelConfig | null,
  ): Promise<void> {
    this.logger.log('Processing Twilio webhook');

    const event = this.whatsappAdapter.parseWebhookPayload(payload);
    if (!event) {
      this.logger.warn('Could not parse Twilio webhook payload');
      return;
    }

    await this.processEvent(event, 'whatsapp', preResolvedConfig);
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
    preResolvedConfig?: ResolvedChannelConfig | null,
  ): Promise<void> {
    switch (event.type) {
      case 'message':
        await this.handleMessageEvent(event, channel, preResolvedConfig);
        break;
      case 'status_update':
        await this.handleStatusUpdate(event);
        break;
      case 'conversation_created':
        await this.handleConversationCreated(event, channel);
        break;
      case 'reaction':
        await this.handleReactionEvent(event);
        break;
      default:
        this.logger.warn(`Unknown event type: ${String((event as { type: unknown }).type)}`);
    }
  }

  private async handleMessageEvent(
    event: NormalizedWebhookEvent,
    channel: ChannelType,
    preResolvedConfig?: ResolvedChannelConfig | null,
  ): Promise<void> {
    if (!event.message) return;

    // 메시지 중복 체크를 conversation 생성 전에 수행 (불필요한 conversation 생성 방지)
    const existingMessage = await this.messageRepository.findByChannelMessageId(
      event.message.channelMessageId,
    );
    if (existingMessage) {
      this.logger.log(`Message ${event.message.channelMessageId} already exists, skipping`);
      return;
    }

    // Resolve clinic/channel config from webhook identifier (멀티테넌트)
    let clinicId: number | null = null;
    let tenantContext: Record<string, unknown> = {};
    let channelConfigId: number | null = null;

    if (preResolvedConfig) {
      // 컨트롤러에서 서명 검증 시 이미 resolve된 config 사용 (중복 조회 방지)
      clinicId = preResolvedConfig.clinicId;
      tenantContext = preResolvedConfig.tenantContext ?? {};
      channelConfigId = preResolvedConfig.channelConfigId;
    } else if (this.webhookChannelResolver) {
      try {
        const resolverIdentifier = event.channelAccountId || event.contactIdentifier;
        const resolved = await this.webhookChannelResolver(
          channel,
          resolverIdentifier,
        );
        if (resolved) {
          clinicId = resolved.clinicId;
          tenantContext = resolved.tenantContext ?? {};
          channelConfigId = resolved.channelConfigId;
        }
      } catch (error) {
        this.logger.warn(`Failed to resolve channel config: ${error}`);
      }
    }

    // Find or create conversation
    // 1차: channelConfigId와 함께 조회 (병원별 대화 격리)
    let conversation = channelConfigId
      ? await this.conversationRepository.findByChannelConversationId(
          event.channelConversationId,
          channelConfigId,
        )
      : null;

    // 2차: 못 찾으면 channelConfigId 없이 조회 (backfill 대상만)
    if (!conversation) {
      const fallback = await this.conversationRepository.findByChannelConversationId(
        event.channelConversationId,
      );
      // channelConfigId가 없는 레거시 대화만 사용 (다른 클리닉 대화는 무시)
      if (fallback && !fallback.channelConfigId) {
        conversation = fallback;
      }
    }

    const isNewConversation = !conversation;

    // Resolve per-clinic credentials for API calls (e.g., fetchUserProfile)
    let resolvedCredentials: import('../adapters/channel.adapter.interface').AdapterCredentialsOverride | undefined;
    if (this.options?.channelCredentialsResolver && channelConfigId) {
      try {
        resolvedCredentials = await this.options.channelCredentialsResolver(channelConfigId);
      } catch (error) {
        this.logger.warn(`Failed to resolve credentials for channelConfigId ${channelConfigId}: ${error}`);
      }
    }

    // Use existing contactName; for Instagram, resolve username asynchronously after message is saved
    let contactName = event.contactName ?? null;

    // If no contactName from event, use previously resolved name from existing conversation
    if (!contactName && conversation?.contactName) {
      contactName = conversation.contactName;
    }

    if (!conversation) {
      conversation = await this.conversationRepository.create({
        channel,
        channelConversationId: event.channelConversationId,
        contactIdentifier: event.contactIdentifier,
        contactName,
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 0,
        lastMessageAt: null,
        lastMessagePreview: null,
        lastInboundAt: event.message.direction === 'inbound' ? event.message.timestamp : null,
        metadata: Object.keys(tenantContext).length > 0 ? { ...tenantContext } : null,
        clinicId,
        channelConfigId,
      });
      this.logger.log(`Created new conversation: ${conversation.id} (clinic: ${clinicId})`);
    } else if (conversation && !conversation.channelConfigId && channelConfigId) {
      // Backfill channelConfigId for conversations created before config resolution was available
      const backfillData: Record<string, unknown> = {
        channelConfigId,
        clinicId: clinicId ?? conversation.clinicId,
      };
      if (Object.keys(tenantContext).length > 0) {
        backfillData.metadata = { ...(conversation.metadata ?? {}), ...tenantContext };
      }
      await this.conversationRepository.update(conversation.id, backfillData);
      conversation.channelConfigId = channelConfigId;
      this.logger.log(`Backfilled channelConfigId=${channelConfigId} for conversation ${conversation.id}`);
    }

    if (channel === 'instagram' && contactName && !conversation.contactName) {
      // Update existing conversation with resolved username
      await this.conversationRepository.update(conversation.id, { contactName });
      conversation.contactName = contactName;
      this.logger.log(`Updated conversation ${conversation.id} with Instagram username: ${contactName}`);
    }

    // Create message (use resolved contactName for inbound messages)
    const senderName = event.message.direction === 'inbound' && contactName
      ? contactName
      : event.message.senderName ?? null;

    // Resolve reply-to context
    let replyToMessageId: number | null = null;
    let replyToPreview: string | null = null;
    if (event.message.replyToExternalId) {
      const replyTarget = await this.messageRepository.findByChannelMessageId(
        event.message.replyToExternalId,
      );
      if (replyTarget) {
        replyToMessageId = replyTarget.id;
        replyToPreview = (replyTarget.contentText ?? '').substring(0, 100) || null;
      }
    }

    // Transform media URL (e.g., Twilio → S3)
    let mediaUrl = event.message.contentMediaUrl ?? null;
    if (mediaUrl && this.mediaUrlTransformer) {
      // preResolvedConfig 우선, 없으면 resolver에서 resolve한 정보로 구성
      const effectiveConfig: ResolvedChannelConfig | null = preResolvedConfig
        ?? (channelConfigId && clinicId
          ? { channelConfigId, clinicId, tenantContext, ...resolvedCredentials }
          : null);

      if (effectiveConfig) {
        try {
          mediaUrl = await this.mediaUrlTransformer(
            mediaUrl,
            event.message.contentType ?? 'image',
            effectiveConfig,
          );
        } catch (error) {
          this.logger.warn(`Media URL transform failed, storing null: ${error}`);
          mediaUrl = null;
        }
      }
    }

    const message = await this.messageRepository.create({
      conversationId: conversation.id,
      channelMessageId: event.message.channelMessageId,
      direction: event.message.direction,
      senderName,
      senderUserId: null,
      contentType: event.message.contentType,
      contentText: event.message.contentText ?? null,
      contentMediaUrl: mediaUrl,
      replyToMessageId,
      replyToPreview,
      status: event.message.direction === 'inbound' ? 'delivered' : 'sent',
      metadata: event.message.metadata ?? null,
      createdAt: event.message.timestamp,
    });

    // Update conversation
    const newUnreadCount =
      event.message.direction === 'inbound'
        ? (conversation.unreadCount ?? 0) + 1
        : conversation.unreadCount ?? 0;

    const updateData: Record<string, unknown> = {
      lastMessageAt: event.message.timestamp,
      lastMessagePreview: event.message.contentText?.substring(0, 100) ?? '[미디어]',
      unreadCount: newUnreadCount,
    };
    if (event.message.direction === 'inbound') {
      updateData.lastInboundAt = event.message.timestamp;
    }
    let updatedConversation = await this.conversationRepository.update(conversation.id, updateData);

    this.logger.log(
      `Message saved: ${event.message.channelMessageId} in conversation ${conversation.id}`,
    );

    // Instagram: resolve username BEFORE WebSocket emit so CRM gets the display name on the first event
    if (channel === 'instagram' && event.contactIdentifier) {
      const needsUsernameResolution = !updatedConversation.contactName || /^\d+$/.test(updatedConversation.contactName);
      if (needsUsernameResolution) {
        try {
          this.logger.log(`Resolving Instagram username for: ${event.contactIdentifier}`);
          const profile = await this.instagramAdapter.fetchUserProfile(
            event.contactIdentifier,
            resolvedCredentials,
          );

          if (profile) {
            const displayName = profile.username
              ? `@${profile.username}`
              : profile.name || null;

            if (displayName) {
              updatedConversation = await this.conversationRepository.update(
                updatedConversation.id,
                { contactName: displayName },
              );
              this.logger.log(`Resolved Instagram username: ${displayName}`);

              // Fire-and-forget: save profile to contact_channel
              this.saveInstagramContactProfile(
                event.contactIdentifier,
                displayName,
                profile.profile_picture_url ?? null,
              );
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to resolve Instagram username for ${event.contactIdentifier}: ${error}`);
          // Graceful degradation: proceed with numeric ID
        }
      }
    }

    // WebSocket으로 실시간 알림 전송 (Instagram인 경우 resolved name이 포함됨)
    this.logger.log(`🔔 Emitting WebSocket events for conversation ${updatedConversation.id}`);
    this.omnichannelGateway?.emitNewMessage(updatedConversation.id, message);
    this.omnichannelGateway?.emitConversationUpdate(updatedConversation);
  }

  /**
   * Instagram 프로필을 contact_channel에 저장 (fire-and-forget)
   */
  private saveInstagramContactProfile(
    contactIdentifier: string,
    displayName: string,
    profilePictureUrl: string | null,
  ): void {
    if (!this.contactChannelRepository) return;

    (async () => {
      try {
        const existing = await this.contactChannelRepository!.findByChannelIdentifier(
          'instagram',
          contactIdentifier,
        );
        if (existing) {
          await this.contactChannelRepository!.update(existing.id, {
            channelDisplayName: displayName,
            channelProfileUrl: profilePictureUrl ?? existing.channelProfileUrl,
          });
        } else {
          await this.contactChannelRepository!.create({
            channel: 'instagram',
            channelIdentifier: contactIdentifier,
            channelDisplayName: displayName,
            channelProfileUrl: profilePictureUrl,
            contactId: null,
            metadata: null,
            lastContactedAt: new Date(),
          });
        }
      } catch (error) {
        this.logger.warn(`[Background] Failed to save Instagram profile for ${contactIdentifier}: ${error}`);
      }
    })();
  }

  private async handleStatusUpdate(
    event: NormalizedWebhookEvent,
  ): Promise<void> {
    if (!event.status) return;

    const { messageId, status, watermark, errorCode, errorMessage } = event.status;

    // Watermark-based bulk update (Instagram read receipts)
    if (watermark && this.messageRepository.findOutboundBeforeTimestamp) {
      const conversation = await this.conversationRepository.findByChannelConversationId(
        event.channelConversationId,
      );
      if (!conversation) {
        this.logger.warn(
          `Watermark update: conversation not found for ${event.channelConversationId}`,
        );
        return;
      }

      const messages = await this.messageRepository.findOutboundBeforeTimestamp(
        conversation.id,
        new Date(watermark),
      );

      const toUpdate = messages.filter(m => m.status !== status);

      for (const msg of toUpdate) {
        await this.messageRepository.updateStatus(msg.channelMessageId, status);
        if (this.omnichannelGateway) {
          this.omnichannelGateway.emitMessageStatusUpdate(
            conversation.id,
            msg.channelMessageId,
            status,
          );
        }
      }

      this.logger.log(
        `Watermark read update: ${toUpdate.length} messages in conversation ${conversation.id}`,
      );
      return;
    }

    // Standard single-message update (WhatsApp, Instagram delivery)
    if (!messageId) return;

    const errorMetadata = (errorCode || errorMessage)
      ? { errorCode, errorMessage }
      : undefined;

    await this.messageService.updateStatus(messageId, status, errorMetadata);

    this.logger.log(
      `Message status updated: ${messageId} -> ${status}${errorMetadata ? ` (error: ${errorCode} - ${errorMessage})` : ''}`,
    );

    const message = await this.messageRepository.findByChannelMessageId(messageId);

    if (message && this.omnichannelGateway) {
      this.omnichannelGateway.emitMessageStatusUpdate(
        message.conversationId,
        messageId,
        status,
        errorMetadata,
      );

      this.logger.log(
        `🔔 Broadcast message status update: ${messageId} -> ${status}`,
      );
    }
  }

  private async handleReactionEvent(
    event: NormalizedWebhookEvent,
  ): Promise<void> {
    if (!event.reaction) return;

    const { targetMessageId, emoji, action } = event.reaction;

    // Find the target message by channelMessageId
    const message = await this.messageRepository.findByChannelMessageId(targetMessageId);
    if (!message) {
      this.logger.warn(`Reaction target message not found: ${targetMessageId}`);
      return;
    }

    // Find the conversation
    const conversation = await this.conversationRepository.findByChannelConversationId(
      event.channelConversationId,
    );
    if (!conversation) {
      this.logger.warn(`Reaction: conversation not found for ${event.channelConversationId}`);
      return;
    }

    // Store reaction in message metadata
    const metadata = message.metadata ?? {};
    const reactions: Array<{ emoji: string; reactedBy: string }> = (metadata as Record<string, unknown>).reactions as Array<{ emoji: string; reactedBy: string }> ?? [];

    if (action === 'react') {
      const alreadyExists = reactions.some(r => r.emoji === emoji && r.reactedBy === event.contactIdentifier);
      if (!alreadyExists) {
        reactions.push({ emoji, reactedBy: event.contactIdentifier });
      }
    } else {
      const idx = reactions.findIndex(r => r.emoji === emoji && r.reactedBy === event.contactIdentifier);
      if (idx >= 0) {
        reactions.splice(idx, 1);
      }
    }

    // Update message metadata with reactions
    if (this.messageRepository.updateMetadata) {
      await this.messageRepository.updateMetadata(message.id, { reactions });
    }

    // Emit real-time event
    if (this.omnichannelGateway) {
      this.omnichannelGateway.emitMessageReaction(conversation.id, {
        messageId: message.id,
        emoji,
        action,
        reactedBy: event.contactIdentifier,
      });
    }

    this.logger.log(
      `Reaction ${action}: ${emoji} on message ${message.id} in conversation ${conversation.id}`,
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
