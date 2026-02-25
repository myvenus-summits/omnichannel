/**
 * Twilio Conversations API Webhook Payload
 * https://www.twilio.com/docs/conversations/conversations-webhooks
 */
export declare class TwilioWebhookDto {
    EventType?: string;
    ConversationSid?: string;
    MessageSid?: string;
    Body?: string;
    Author?: string;
    ParticipantSid?: string;
    AccountSid?: string;
    Source?: string;
    MediaContentType?: string;
    MediaUrl?: string;
    DateCreated?: string;
    SmsMessageSid?: string;
    SmsStatus?: string;
    From?: string;
    To?: string;
    ProfileName?: string;
    WaId?: string;
    NumMedia?: string;
    NumSegments?: string;
    ButtonPayload?: string;
    ReferralNumMedia?: string;
    ApiVersion?: string;
}
/**
 * Meta Webhook Verification Query
 */
export declare class MetaVerifyDto {
    'hub.mode': string;
    'hub.verify_token': string;
    'hub.challenge': string;
}
/**
 * Meta Webhook Payload (Instagram/Messenger)
 * https://developers.facebook.com/docs/messenger-platform/webhooks
 */
export declare class MetaWebhookDto {
    object: string;
    entry: MetaWebhookEntry[];
}
export declare class MetaWebhookEntry {
    id: string;
    time: number;
    messaging?: MetaMessagingEvent[];
}
export declare class MetaMessagingEvent {
    sender: {
        id: string;
    };
    recipient: {
        id: string;
    };
    timestamp: number;
    message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
            type: string;
            payload: {
                url: string;
            };
        }>;
    };
    delivery?: {
        mids: string[];
        watermark: number;
    };
    read?: {
        watermark: number;
    };
}
//# sourceMappingURL=webhook-payload.dto.d.ts.map