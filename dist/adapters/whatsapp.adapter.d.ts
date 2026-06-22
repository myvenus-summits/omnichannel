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
     * Guarantee a non-empty, collision-resistant channel message id.
     *
     * Twilio's MessageSid/SmsMessageSid is effectively always present on real
     * webhooks, but when it is missing we must never emit ''. Under the
     * server-side ON CONFLICT upsert (MW-89) two distinct messages sharing the
     * empty-string key would silently merge, and a status update keyed on ''
     * could match the wrong stored row. The fallback is derived from stable
     * payload fields so a retried webhook for the same message yields the same
     * id (correct dedup) rather than a fresh duplicate.
     */
    private ensureChannelMessageId;
    /**
     * Parse Twilio Conversations API webhook payload
     */
    private parseConversationsApiPayload;
    /**
     * Parse Twilio Messaging API webhook payload (Sandbox format)
     * https://www.twilio.com/docs/messaging/guides/webhook-request
     */
    private parseMessagingApiPayload;
    /**
     * Extract Click-to-WhatsApp (CTWA) ad referral attributes from a Twilio
     * Messaging API webhook.
     *
     * Twilio sends these fields ONLY when the inbound message originated from a
     * Meta "Click to WhatsApp" ad (Instagram / Facebook). For organic messages
     * none are present, so this returns `undefined` and the message metadata is
     * left byte-for-byte unchanged — keeping behaviour identical for non-ad
     * traffic across every service that consumes this package.
     *
     * https://www.twilio.com/docs/messaging/guides/webhook-request
     */
    private parseReferral;
    fetchMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }, credentials?: AdapterCredentialsOverride): Promise<NormalizedMessage[]>;
    /**
     * Messaging API를 통한 메시지 조회 (WhatsApp Sandbox / Business API)
     * inbound + outbound 양방향 메시지를 조회해서 시간순으로 정렬
     */
    private fetchMessagesViaMessagingApi;
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