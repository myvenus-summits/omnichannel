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
/**
 * Meta ad context attached to an ad-originated Instagram DM referral.
 * Present only when the conversation started from a "click to Instagram DM" ad.
 */
export declare class InstagramAdsContextData {
    ad_title?: string;
    photo_url?: string;
    video_url?: string;
    post_id?: string;
}
/**
 * Meta ad referral on an inbound Instagram DM.
 *
 * Sent by Meta ONLY when the inbound message originated from a Meta ad that
 * clicks to Instagram DM. Must be declared (with its nested class) so the global
 * ValidationPipe({ whitelist: true }) does not strip it before the adapter runs.
 * https://developers.facebook.com/docs/messenger-platform/instagram/features/ads
 */
export declare class InstagramReferral {
    ref?: string;
    ad_id?: string;
    source?: string;
    type?: string;
    ads_context_data?: InstagramAdsContextData;
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
    app_id?: number;
    is_unsupported?: boolean;
    referral?: InstagramReferral;
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
export declare class InstagramOptin {
    type: string;
}
export declare class InstagramMessagingEvent {
    sender: InstagramSender;
    recipient: InstagramRecipient;
    timestamp: number;
    message?: InstagramMessage;
    delivery?: InstagramDelivery;
    read?: InstagramRead;
    reaction?: InstagramReaction;
    optin?: InstagramOptin;
    referral?: InstagramReferral;
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