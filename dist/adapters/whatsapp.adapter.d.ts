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
    private readonly authToken;
    private readonly appUrl;
    /**
     * 채널별 Twilio 클라이언트 캐시. 키는 `accountSid:authToken` 자격증명 쌍이다.
     *
     * 캐시가 없으면 채널 설정이 자격증명을 들고 있는 한 **메시지 한 건마다**
     * `new Twilio()` 를 만들게 된다 — 그때마다 새 HTTP 에이전트가 생겨 keep-alive
     * 가 무의미해지고, 대량 발송에서 소켓이 쌓인다.
     */
    private readonly clientCache;
    /** 캐시 상한. 채널 수 + 로테이션으로 남는 옛 항목을 감안한 여유값. */
    private static readonly MAX_CACHED_CLIENTS;
    readonly channel: ChannelType;
    constructor(options?: OmnichannelModuleOptions | undefined);
    /**
     * Resolve Twilio client: override credentials 가 기본값과 다르면 새 클라이언트 생성.
     *
     * **자격증명 쌍 전체를 비교한다.** 예전에는 `accountSid` 만 비교해서, 같은 계정에서
     * `authToken` 만 바뀐 채널 설정이 조용히 무시됐다 — 조건이 거짓이 되어 env 로 만든
     * 기본 클라이언트로 떨어졌기 때문이다. 2026-08-03 에 Auth Token 을 재발급하고
     * 채널 설정에 새 값을 넣었는데도 발송이 20003(Authenticate)으로 계속 죽은 원인이
     * 이것이었고, SSM + 재배포 말고는 반영할 방법이 없었다.
     *
     * 계정이 하나뿐인 지금 구성에서는 `accountSid` 비교가 **항상** 거짓이라, 사실상
     * 채널별 자격증명 기능 전체가 동작하지 않는 상태였다.
     */
    private resolveTwilioClient;
    /**
     * 자격증명 쌍당 Twilio 클라이언트 하나. 토큰이 로테이션되면 새 키가 생기고 옛
     * 항목은 남는데, 상한에 닿으면 통째로 비워 무한 증가를 막는다(채널 수가 적어
     * LRU 를 둘 만큼의 이득이 없다). 키에 토큰이 들어가므로 로깅하지 않는다.
     */
    private getOrCreateClient;
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