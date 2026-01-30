/**
 * Instagram Messaging Webhook Payload
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
 */
export declare class InstagramSender {
    id: string;
}
export declare class InstagramRecipient {
    id: string;
}
export declare class InstagramMessageAttachment {
    type: string;
    payload: {
        url: string;
    };
}
export declare class InstagramMessage {
    mid: string;
    text?: string;
    attachments?: InstagramMessageAttachment[];
    quick_reply?: {
        payload: string;
    };
    reply_to?: {
        mid: string;
    };
    is_deleted?: boolean;
    is_echo?: boolean;
    is_unsupported?: boolean;
}
export declare class InstagramDelivery {
    mids: string[];
    watermark: number;
}
export declare class InstagramRead {
    watermark: number;
}
export declare class InstagramReaction {
    mid: string;
    action: 'react' | 'unreact';
    reaction?: string;
    emoji?: string;
}
export declare class InstagramMessagingEvent {
    sender: InstagramSender;
    recipient: InstagramRecipient;
    timestamp: number;
    message?: InstagramMessage;
    delivery?: InstagramDelivery;
    read?: InstagramRead;
    reaction?: InstagramReaction;
}
export declare class InstagramWebhookEntry {
    id: string;
    time: number;
    messaging?: InstagramMessagingEvent[];
}
export declare class InstagramWebhookDto {
    object: 'instagram';
    entry: InstagramWebhookEntry[];
}
//# sourceMappingURL=instagram-webhook.dto.d.ts.map