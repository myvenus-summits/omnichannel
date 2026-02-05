import type { IConversation, CreateConversationData, UpdateConversationData } from './conversation.interface';
import type { IMessage, CreateMessageData } from './message.interface';
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
        /** @since 1.1.0 멀티테넌트 필터 */
        clinicId?: number;
        /** @since 1.1.0 멀티테넌트 필터 */
        regionId?: number;
        /** @since 1.1.0 채널 설정 필터 */
        channelConfigId?: number;
    }): Promise<PaginatedResult<IConversation>>;
    findOne(id: number): Promise<IConversation | null>;
    findByChannelConversationId(channelConversationId: string): Promise<IConversation | null>;
    create(data: Partial<CreateConversationData>): Promise<IConversation>;
    update(id: number, data: UpdateConversationData): Promise<IConversation>;
    incrementUnreadCount(id: number): Promise<void>;
    updateLastMessage(id: number, preview: string, timestamp: Date): Promise<void>;
}
/**
 * Message Repository 인터페이스
 * 외부에서 구현하여 주입
 */
export interface IMessageRepository {
    findByConversation(conversationId: number, options?: {
        limit?: number;
        before?: string;
    }): Promise<IMessage[]>;
    findOne(id: number): Promise<IMessage | null>;
    findByChannelMessageId(channelMessageId: string): Promise<IMessage | null>;
    create(data: Partial<CreateMessageData>): Promise<IMessage>;
    updateStatus(channelMessageId: string, status: string): Promise<void>;
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
export declare const CONVERSATION_REPOSITORY = "CONVERSATION_REPOSITORY";
export declare const MESSAGE_REPOSITORY = "MESSAGE_REPOSITORY";
export declare const QUICK_REPLY_REPOSITORY = "QUICK_REPLY_REPOSITORY";
export declare const CONTACT_CHANNEL_REPOSITORY = "CONTACT_CHANNEL_REPOSITORY";
//# sourceMappingURL=repository.interface.d.ts.map