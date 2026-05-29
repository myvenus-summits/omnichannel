/**
 * Omnichannel Types
 */

export type ChannelType = 'whatsapp' | 'instagram' | 'line';

export type ConversationStatus = 'open' | 'closed' | 'snoozed';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'file'
  | 'template';

export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

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

/**
 * Click-to-WhatsApp (CTWA) ad referral attributes.
 *
 * Populated by channel adapters ONLY when an inbound message originated from a
 * Meta "Click to WhatsApp" ad (Instagram / Facebook). Surfaced on
 * `NormalizedMessage.metadata.referral` and persisted as-is in the message's
 * jsonb metadata, so any consuming service (mywave / myvenus / myderma) can
 * opt in to ad attribution by reading this object — no further changes to the
 * shared package are required, and non-ad traffic is completely unaffected.
 *
 * https://www.twilio.com/docs/messaging/guides/webhook-request
 */
export interface CtwaReferral {
  /** Meta-generated click ID. Forward to Meta Conversions API as `ctwa_clid`. */
  ctwaClid?: string;
  /** Meta/WhatsApp ID of the source ad (identifies the ad/campaign). */
  sourceId?: string;
  /** Type of the source ad. */
  sourceType?: string;
  /** URL referenced by the ad. */
  sourceUrl?: string;
  /** Ad headline text. */
  headline?: string;
  /** Ad body text. */
  body?: string;
  /** Meta/WhatsApp ID of the ad media (not a Twilio Media SID). */
  mediaId?: string;
  /** Content type of the ad media. */
  mediaContentType?: string;
  /** URL of the ad media. */
  mediaUrl?: string;
  /** Number of media items in the ad. */
  numMedia?: string;
}

export interface NormalizedWebhookEvent {
  type: 'message' | 'status_update' | 'conversation_created' | 'reaction';
  channelConversationId: string;
  contactIdentifier: string;
  contactName?: string;
  channelAccountId?: string;
  message?: NormalizedMessage;
  status?: {
    messageId: string;
    status: MessageStatus;
    watermark?: number;
    errorCode?: number;
    errorMessage?: string;
  };
  reaction?: {
    targetMessageId: string;
    emoji: string;
    action: 'react' | 'unreact';
  };
}
