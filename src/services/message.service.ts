import { Injectable, Logger, NotFoundException, BadRequestException, Inject, Optional } from '@nestjs/common';
import type { CreateMessageDto } from '../dto';
import type { IMessage, IMessageRepository } from '../interfaces';
import {
  MESSAGE_REPOSITORY,
  OMNICHANNEL_MODULE_OPTIONS,
  type OmnichannelModuleOptions,
} from '../interfaces';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import type { AdapterCredentialsOverride } from '../adapters/channel.adapter.interface';
import { ConversationService } from './conversation.service';
import type { MessageDirection, MessageStatus, SendMessageResult } from '../types';

const CHANNEL_MESSAGE_LIMITS: Record<string, number> = {
  whatsapp: 1024,
  instagram: 1000,
};
const DEFAULT_MESSAGE_LIMIT = 1000;

/**
 * 긴 텍스트를 최대 길이 이하의 청크로 분할 (줄바꿈 기준 우선 분할)
 */
function splitTextIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // 줄바꿈 기준으로 분할 시도
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex <= 0) {
      // 줄바꿈이 없으면 공백 기준으로 분할
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex <= 0) {
      // 공백도 없으면 강제 분할
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).replace(/^\n/, '');
  }

  return chunks;
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Optional()
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly moduleOptions: OmnichannelModuleOptions | undefined,
    private readonly whatsappAdapter: WhatsAppAdapter,
    private readonly instagramAdapter: InstagramAdapter,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * channelConfigId로 동적 credentials 조회
   */
  private async resolveCredentials(
    channelConfigId?: number | null,
  ): Promise<AdapterCredentialsOverride | undefined> {
    if (!channelConfigId || !this.moduleOptions?.channelCredentialsResolver) {
      return undefined;
    }
    try {
      const creds =
        await this.moduleOptions.channelCredentialsResolver(channelConfigId);
      return creds;
    } catch (error) {
      this.logger.warn(
        `Failed to resolve credentials for channelConfigId=${channelConfigId}`,
        error,
      );
      return undefined;
    }
  }

  async findByConversation(
    conversationId: number,
    options?: { limit?: number; before?: string },
  ): Promise<IMessage[]> {
    return this.messageRepository.findByConversation(conversationId, options);
  }

  async findOne(id: number): Promise<IMessage> {
    const message = await this.messageRepository.findOne(id);

    if (!message) {
      throw new NotFoundException(`Message #${id} not found`);
    }

    return message;
  }

  async create(data: Partial<IMessage>): Promise<IMessage> {
    return this.messageRepository.create(data);
  }

  async sendMessage(
    conversationId: number,
    dto: CreateMessageDto,
    senderUserId?: number,
    senderName?: string,
  ): Promise<IMessage> {
    const conversation = await this.conversationService.findOne(conversationId);

    // 멀티테넌트: conversation의 channelConfigId로 credentials 조회
    const credentials = await this.resolveCredentials(
      conversation.channelConfigId,
    );

    // Resolve reply-to context
    let replyToMessageId: number | null = null;
    let replyToPreview: string | null = null;
    let replyToExternalId: string | undefined;

    if (dto.replyToMessageId) {
      const replyTarget = await this.messageRepository.findOne(dto.replyToMessageId);
      if (replyTarget) {
        replyToMessageId = replyTarget.id;
        replyToPreview = (replyTarget.contentText ?? '').substring(0, 100) || null;
        replyToExternalId = replyTarget.channelMessageId;
      }
    }

    let result!: SendMessageResult;
    const adapter = conversation.channel === 'instagram'
      ? this.instagramAdapter
      : this.whatsappAdapter;

    if (dto.contentType === 'template' && dto.templateId) {
      result = await adapter.sendTemplateMessage(
        conversation.contactIdentifier,
        dto.templateId,
        dto.templateVariables ?? {},
        credentials,
      );
    } else {
      const messageType =
        dto.contentType === 'text'
          ? 'text'
          : dto.contentType === 'image'
            ? 'image'
            : 'file';

      // 채널별 글자수 제한
      const maxLength = CHANNEL_MESSAGE_LIMITS[conversation.channel] ?? DEFAULT_MESSAGE_LIMIT;

      // 긴 텍스트 메시지를 청크로 분할하여 전송
      if (messageType === 'text' && dto.contentText && dto.contentText.length > maxLength) {
        const chunks = splitTextIntoChunks(dto.contentText, maxLength);
        this.logger.log(
          `Splitting long message (${dto.contentText.length} chars) into ${chunks.length} chunks`,
        );

        for (let i = 0; i < chunks.length; i++) {
          result = await adapter.sendMessage(
            conversation.contactIdentifier,
            {
              type: messageType,
              text: chunks[i],
              mediaUrl: undefined,
              // reply context는 첫 번째 청크에만 적용
              replyToExternalId: i === 0 ? replyToExternalId : undefined,
            },
            credentials,
          );

          if (!result.success) {
            throw new Error(`Failed to send message chunk ${i + 1}/${chunks.length}: ${result.error}`);
          }
        }
      } else {
        result = await adapter.sendMessage(
          conversation.contactIdentifier,
          {
            type: messageType,
            text: dto.contentText,
            mediaUrl: dto.contentMediaUrl,
            replyToExternalId,
          },
          credentials,
        );
      }
    }

    if (!result.success) {
      throw new Error(`Failed to send message: ${result.error}`);
    }

    const message = await this.create({
      conversationId,
      channelMessageId: result.channelMessageId ?? `local-${Date.now()}`,
      direction: 'outbound',
      senderUserId,
      contentType: dto.contentType,
      contentText: dto.contentText ?? null,
      contentMediaUrl: dto.contentMediaUrl ?? null,
      replyToMessageId,
      replyToPreview,
      status: 'sent',
      senderName: senderName ?? null,
      metadata: null,
    });

    await this.conversationService.updateLastMessage(
      conversationId,
      dto.contentText?.substring(0, 100) ?? '[Media]',
      new Date(),
    );

    return message;
  }

  async createFromWebhook(
    conversationId: number,
    data: {
      channelMessageId: string;
      direction: MessageDirection;
      senderName?: string;
      contentType: string;
      contentText?: string;
      contentMediaUrl?: string;
      timestamp: Date;
      metadata?: Record<string, unknown>;
    },
  ): Promise<IMessage> {
    const existing = await this.messageRepository.findByChannelMessageId(
      data.channelMessageId,
    );

    if (existing) {
      this.logger.log(`Message ${data.channelMessageId} already exists`);
      return existing;
    }

    const message = await this.create({
      conversationId,
      channelMessageId: data.channelMessageId,
      direction: data.direction,
      senderName: data.senderName ?? null,
      contentType: data.contentType as IMessage['contentType'],
      contentText: data.contentText ?? null,
      contentMediaUrl: data.contentMediaUrl ?? null,
      status: 'delivered',
      metadata: data.metadata ?? null,
      senderUserId: null,
      createdAt: data.timestamp,
    });

    if (data.direction === 'inbound') {
      await this.conversationService.incrementUnreadCount(conversationId);
    }

    await this.conversationService.updateLastMessage(
      conversationId,
      data.contentText?.substring(0, 100) ?? '[Media]',
      data.timestamp,
    );

    return message;
  }

  async updateStatus(
    channelMessageId: string,
    status: MessageStatus,
    errorMetadata?: { errorCode?: number; errorMessage?: string },
  ): Promise<void> {
    await this.messageRepository.updateStatus(channelMessageId, status, errorMetadata);
  }

  /**
   * 대화 메시지를 채널 API에서 가져와 누락된 메시지를 DB에 저장 (Instagram/WhatsApp)
   */
  async syncMessages(conversationId: number): Promise<{ synced: number }> {
    const conversation = await this.conversationService.findOne(conversationId);
    const { channel } = conversation;

    if (channel !== 'instagram' && channel !== 'whatsapp') {
      throw new BadRequestException('Instagram 또는 WhatsApp 대화만 동기화할 수 있습니다');
    }

    const credentials = await this.resolveCredentials(conversation.channelConfigId);

    let channelMessages: import('../types').NormalizedMessage[];

    if (channel === 'instagram') {
      channelMessages = await this.instagramAdapter.fetchConversationMessages(
        conversation.contactIdentifier,
        credentials,
      );
    } else {
      channelMessages = await this.whatsappAdapter.fetchMessages(
        conversation.contactIdentifier,
        { limit: 200 },
        credentials,
      );
    }

    let synced = 0;
    let newestSyncedTimestamp: Date | null = null;
    let newestSyncedPreview: string | null = null;

    for (const msg of channelMessages) {
      const existing = await this.messageRepository.findByChannelMessageId(
        msg.channelMessageId,
      );
      if (existing) continue;

      await this.create({
        conversationId,
        channelMessageId: msg.channelMessageId,
        direction: msg.direction,
        senderName: msg.senderName ?? null,
        contentType: msg.contentType as IMessage['contentType'],
        contentText: msg.contentText ?? null,
        contentMediaUrl: msg.contentMediaUrl ?? null,
        status: 'delivered',
        metadata: msg.metadata ?? null,
        senderUserId: null,
        createdAt: msg.timestamp,
      });
      synced++;

      if (!newestSyncedTimestamp || msg.timestamp > newestSyncedTimestamp) {
        newestSyncedTimestamp = msg.timestamp;
        newestSyncedPreview = msg.contentText?.substring(0, 100) ?? '[Media]';
      }
    }

    // Update conversation summary if synced messages are newer
    if (newestSyncedTimestamp) {
      const currentLastMessageAt = conversation.lastMessageAt
        ? new Date(conversation.lastMessageAt)
        : null;

      if (!currentLastMessageAt || newestSyncedTimestamp > currentLastMessageAt) {
        await this.conversationService.updateLastMessage(
          conversationId,
          newestSyncedPreview ?? '[Media]',
          newestSyncedTimestamp,
        );
      }
    }

    this.logger.log(`Synced ${synced} ${channel} messages for conversation ${conversationId}`);
    return { synced };
  }

  /**
   * @deprecated syncMessages()를 사용하세요
   */
  async syncInstagramMessages(conversationId: number): Promise<{ synced: number }> {
    return this.syncMessages(conversationId);
  }

  async resendMessage(messageId: number): Promise<IMessage> {
    const original = await this.findOne(messageId);

    if (original.status !== 'failed') {
      throw new BadRequestException('Only failed messages can be resent');
    }
    if (original.direction !== 'outbound') {
      throw new BadRequestException('Only outbound messages can be resent');
    }

    if (original.contentType === 'template') {
      throw new BadRequestException(
        'Template messages cannot be resent. Please send a new template message.',
      );
    }

    if (!original.contentText && !original.contentMediaUrl) {
      throw new BadRequestException(
        'Cannot resend message: no content text or media URL found',
      );
    }

    const conversation = await this.conversationService.findOne(original.conversationId);
    const credentials = await this.resolveCredentials(conversation.channelConfigId);

    const adapter = conversation.channel === 'instagram'
      ? this.instagramAdapter
      : this.whatsappAdapter;

    const messageType =
      original.contentType === 'text'
        ? 'text'
        : original.contentType === 'image'
          ? 'image'
          : 'file';

    const result = await adapter.sendMessage(
      conversation.contactIdentifier,
      {
        type: messageType as 'text' | 'image' | 'file',
        text: original.contentText ?? undefined,
        mediaUrl: original.contentMediaUrl ?? undefined,
      },
      credentials,
    );

    if (!result.success) {
      throw new Error(`Failed to resend message: ${result.error}`);
    }

    // Clear error metadata and mark as sent
    await this.messageRepository.updateStatus(original.channelMessageId, 'sent', {
      errorCode: undefined,
      errorMessage: undefined,
    });

    this.logger.log(`Message ${messageId} resent successfully (new SID: ${result.channelMessageId})`);

    return this.findOne(messageId);
  }
}
