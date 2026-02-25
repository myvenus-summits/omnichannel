import type { IConversation, CreateConversationData, UpdateConversationData } from './conversation.interface';
import type { IMessage, CreateMessageData, UpdateMessageData } from './message.interface';
import type { IQuickReply, CreateQuickReplyData, UpdateQuickReplyData } from './quick-reply.interface';
import type { IContactChannel, CreateContactChannelData, UpdateContactChannelData } from './contact-channel.interface';

/**
 * 페이지네이션 결과
 */
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Conversation Repository 인터페이스
 * 외부에서 구현하여 주입
 */
export interface IConversationRepository {
  findAll(filter: {
    channel?: string;
    status?: string;
    assignedUserId?: number;
    unassigned?: boolean;
    tags?: string[];
    search?: string;
    page?: number;
    limit?: number;
    customerId?: number;
    /** @since 1.1.0 멀티테넌트 필터 */
    clinicId?: number;
    /** @since 1.1.0 채널 설정 필터 */
    channelConfigId?: number;
    /** 언어 필터 (단일) */
    language?: string;
    /** 채널 필터 (복수) */
    channels?: string[];
    /** 언어 필터 (복수) */
    languages?: string[];
    /** 예약 배지 필터 (COMPLETED, CONFIRMED, IN_PROGRESS) */
    reservationBadge?: string;
    /** 프로젝트별 커스텀 필터 키 */
    [key: string]: unknown;
  }): Promise<PaginatedResult<IConversation>>;

  findOne(id: number): Promise<IConversation | null>;
  findByChannelConversationId(channelConversationId: string): Promise<IConversation | null>;
  create(data: Partial<CreateConversationData>): Promise<IConversation>;
  update(id: number, data: UpdateConversationData): Promise<IConversation>;
  incrementUnreadCount(id: number): Promise<void>;
  updateLastMessage(id: number, preview: string, timestamp: Date): Promise<void>;
  linkCustomer?(id: number, customerId: number): Promise<void>;

  // Archive related methods
  findArchivable?(cutoffDate: Date, limit: number): Promise<IConversation[]>;
  findArchivedByCustomer?(customerId: number): Promise<IConversation[]>;
}

/**
 * Message Repository 인터페이스
 * 외부에서 구현하여 주입
 */
export interface IMessageRepository {
  findByConversation(
    conversationId: number,
    options?: { limit?: number; before?: string },
  ): Promise<IMessage[]>;

  findAllByConversation?(conversationId: number): Promise<IMessage[]>;

  findOne(id: number): Promise<IMessage | null>;
  findByChannelMessageId(channelMessageId: string): Promise<IMessage | null>;
  create(data: Partial<CreateMessageData>): Promise<IMessage>;
  updateStatus(channelMessageId: string, status: string, errorMetadata?: { errorCode?: number; errorMessage?: string }): Promise<void>;

  findOutboundBeforeTimestamp?(
    conversationId: number,
    timestamp: Date,
  ): Promise<IMessage[]>;

  updateMetadata?(
    messageId: number,
    metadata: Record<string, unknown>,
  ): Promise<void>;

  // Archive related methods
  deleteByConversation?(conversationId: number): Promise<number>;
}

/**
 * QuickReply Repository 인터페이스
 * 외부에서 구현하여 주입
 */
export interface IQuickReplyRepository {
  findAll(query: {
    search?: string;
    activeOnly?: boolean;
  }): Promise<IQuickReply[]>;

  findOne(id: number): Promise<IQuickReply | null>;
  findByShortcut(shortcut: string): Promise<IQuickReply | null>;
  create(data: Partial<CreateQuickReplyData>): Promise<IQuickReply>;
  update(id: number, data: UpdateQuickReplyData): Promise<IQuickReply>;
  delete(id: number): Promise<void>;
  incrementUsage(id: number): Promise<void>;
}

/**
 * ContactChannel Repository 인터페이스
 * 외부에서 구현하여 주입
 */
export interface IContactChannelRepository {
  findByChannelIdentifier(channel: string, identifier: string): Promise<IContactChannel | null>;
  findByContactId(contactId: number): Promise<IContactChannel[]>;
  create(data: Partial<CreateContactChannelData>): Promise<IContactChannel>;
  update(id: number, data: UpdateContactChannelData): Promise<IContactChannel>;
}

/**
 * Repository injection tokens
 */
export const CONVERSATION_REPOSITORY = 'CONVERSATION_REPOSITORY';
export const MESSAGE_REPOSITORY = 'MESSAGE_REPOSITORY';
export const QUICK_REPLY_REPOSITORY = 'QUICK_REPLY_REPOSITORY';
export const CONTACT_CHANNEL_REPOSITORY = 'CONTACT_CHANNEL_REPOSITORY';
