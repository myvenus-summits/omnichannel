/**
 * Omnichannel Types
 */
export type ChannelType = 'whatsapp' | 'instagram' | 'line';
export type ConversationStatus = 'open' | 'closed' | 'snoozed';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageContentType = 'text' | 'image' | 'video' | 'file' | 'template';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export interface MessageContent {
    type: 'text' | 'image' | 'file';
    text?: string;
    mediaUrl?: string;
    replyToExternalId?: string;
}
export interface SendMessageResult {
    success: boolean;
    channelMessageId?: string;
    error?: string;
}
export interface NormalizedMessage {
    channelMessageId: string;
    direction: MessageDirection;
    senderName: string;
    contentType: MessageContentType;
    contentText?: string;
    contentMediaUrl?: string;
    replyToExternalId?: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface NormalizedWebhookEvent {
    type: 'message' | 'status_update' | 'conversation_created';
    channelConversationId: string;
    contactIdentifier: string;
    contactName?: string;
    channelAccountId?: string;
    message?: NormalizedMessage;
    status?: {
        messageId: string;
        status: MessageStatus;
        watermark?: number;
    };
}
//# sourceMappingURL=omnichannel.types.d.ts.map