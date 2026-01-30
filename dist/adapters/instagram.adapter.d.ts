import type { ChannelAdapter } from './channel.adapter.interface';
import type { MessageContent, SendMessageResult, NormalizedWebhookEvent, NormalizedMessage, ChannelType } from '../types';
import { type OmnichannelModuleOptions } from '../interfaces';
export declare class InstagramAdapter implements ChannelAdapter {
    private readonly options?;
    private readonly logger;
    private readonly accessToken;
    private readonly appSecret;
    private readonly webhookVerifyToken;
    private readonly apiVersion;
    private readonly baseUrl;
    readonly channel: ChannelType;
    constructor(options?: OmnichannelModuleOptions | undefined);
    /**
     * Send a message via Instagram Messaging API
     */
    sendMessage(to: string, content: MessageContent): Promise<SendMessageResult>;
    /**
     * Send a template message (Instagram generic template)
     */
    sendTemplateMessage(to: string, templateId: string, variables: Record<string, string>): Promise<SendMessageResult>;
    /**
     * Parse Instagram webhook payload into normalized event
     */
    parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null;
    /**
     * Fetch messages from Instagram conversation
     */
    fetchMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<NormalizedMessage[]>;
    /**
     * Verify webhook subscription
     */
    verifyWebhook(token: string): boolean;
    /**
     * Build message payload based on content type
     */
    private buildMessagePayload;
    /**
     * Parse individual messaging event
     */
    private parseMessagingEvent;
    /**
     * Determine content type from message
     */
    private determineContentType;
    /**
     * Extract media URL from message attachments
     */
    private extractMediaUrl;
    /**
     * Build consistent conversation ID from participant IDs
     */
    private buildConversationId;
    /**
     * Determine message direction based on sender
     */
    private determineDirection;
}
//# sourceMappingURL=instagram.adapter.d.ts.map