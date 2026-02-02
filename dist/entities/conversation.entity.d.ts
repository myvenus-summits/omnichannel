import type { ChannelType, ConversationStatus } from '../types';
export declare class Conversation {
    id: number;
    channel: ChannelType;
    channelConversationId: string;
    contactIdentifier: string;
    contactName: string | null;
    status: ConversationStatus;
    tags: string[];
    assignedUserId: number | null;
    unreadCount: number;
    lastMessageAt: Date | null;
    lastMessagePreview: string | null;
    metadata: Record<string, unknown> | null;
    messages: import('./message.entity').Message[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=conversation.entity.d.ts.map