import type { MessageDirection, MessageContentType, MessageStatus } from '../types';
/**
 * Message 인터페이스
 * 외부에서 엔티티 구조를 직접 정의하여 사용
 */
export interface IMessage {
    id: number;
    conversationId: number;
    channelMessageId: string;
    direction: MessageDirection;
    senderName: string | null;
    senderUserId: number | null;
    contentType: MessageContentType;
    contentText: string | null;
    contentMediaUrl: string | null;
    status: MessageStatus;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
}
/**
 * Message 생성용 데이터
 */
export type CreateMessageData = Omit<IMessage, 'id' | 'createdAt'> & {
    id?: number;
    createdAt?: Date;
};
/**
 * Message 업데이트용 데이터
 */
export type UpdateMessageData = Partial<Omit<IMessage, 'id' | 'createdAt'>>;
//# sourceMappingURL=message.interface.d.ts.map