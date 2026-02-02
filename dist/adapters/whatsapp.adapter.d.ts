import type { ChannelAdapter } from './channel.adapter.interface';
import type { MessageContent, SendMessageResult, NormalizedWebhookEvent, NormalizedMessage, ChannelType } from '../types';
import { type OmnichannelModuleOptions } from '../interfaces';
export declare class WhatsAppAdapter implements ChannelAdapter {
    private readonly options?;
    private readonly logger;
    private readonly client;
    private readonly conversationsServiceSid;
    private readonly whatsappNumber;
    private readonly apiKeySid;
    private readonly apiKeySecret;
    private readonly accountSid;
    readonly channel: ChannelType;
    constructor(options?: OmnichannelModuleOptions | undefined);
    /**
     * Send message - auto-detects API based on destination format
     * - ConversationSid (CH...) -> Conversations API
     * - Phone number (whatsapp:+...) -> Messaging API
     */
    sendMessage(to: string, content: MessageContent): Promise<SendMessageResult>;
    /**
     * Send message via Twilio Messaging API (for Sandbox/direct WhatsApp)
     */
    private sendMessageViaMessagingApi;
    /**
     * Send message via Twilio Conversations API
     */
    private sendMessageViaConversationsApi;
    sendTemplateMessage(to: string, templateId: string, variables: Record<string, string>): Promise<SendMessageResult>;
    parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null;
    /**
     * Parse Twilio Conversations API webhook payload
     */
    private parseConversationsApiPayload;
    /**
     * Parse Twilio Messaging API webhook payload (Sandbox format)
     * https://www.twilio.com/docs/messaging/guides/webhook-request
     */
    private parseMessagingApiPayload;
    fetchMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<NormalizedMessage[]>;
    generateAccessToken(identity: string): Promise<string>;
    private mapMediaType;
    private mapTwilioStatus;
    /**
     * Map Messaging API status to internal status
     * https://www.twilio.com/docs/sms/api/message-resource#message-status-values
     */
    private mapMessagingApiStatus;
}
//# sourceMappingURL=whatsapp.adapter.d.ts.map