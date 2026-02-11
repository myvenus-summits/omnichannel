import type { ChannelAdapter, AdapterCredentialsOverride } from './channel.adapter.interface';
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
    private readonly appUrl;
    readonly channel: ChannelType;
    constructor(options?: OmnichannelModuleOptions | undefined);
    /**
     * Resolve Twilio client: override credentials가 기본값과 다르면 새 클라이언트 생성
     */
    private resolveTwilioClient;
    /**
     * Send message - auto-detects API based on destination format
     * - ConversationSid (CH...) -> Conversations API
     * - Phone number (whatsapp:+...) -> Messaging API
     */
    sendMessage(to: string, content: MessageContent, credentials?: AdapterCredentialsOverride): Promise<SendMessageResult>;
    /**
     * Send message via Twilio Messaging API (for Sandbox/direct WhatsApp)
     */
    private sendMessageViaMessagingApi;
    /**
     * Send message via Twilio Conversations API
     */
    private sendMessageViaConversationsApi;
    sendTemplateMessage(to: string, templateId: string, variables: Record<string, string>, credentials?: AdapterCredentialsOverride): Promise<SendMessageResult>;
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