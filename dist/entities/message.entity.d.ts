import type { MessageDirection, MessageContentType, MessageStatus } from '../types';
import { Conversation } from './conversation.entity';
export declare class Message {
    id: number;
    conversation: Conversation;
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
//# sourceMappingURL=message.entity.d.ts.map