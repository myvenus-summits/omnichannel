import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Instagram Messaging Webhook Payload
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
 */

export class InstagramSender {
  @ApiProperty({ description: 'Instagram-scoped ID' })
  @IsString()
  id!: string;
}

export class InstagramRecipient {
  @ApiProperty({ description: 'Instagram-scoped ID' })
  @IsString()
  id!: string;
}

export class InstagramMessageAttachment {
  @ApiProperty({ description: 'Attachment type (image, video, audio, file)' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Attachment payload' })
  payload!: {
    url: string;
  };
}

/**
 * Meta ad context attached to an ad-originated Instagram DM referral.
 * Present only when the conversation started from a "click to Instagram DM" ad.
 */
export class InstagramAdsContextData {
  @ApiPropertyOptional({ description: 'Ad: title/headline text' })
  @IsOptional()
  @IsString()
  ad_title?: string;

  @ApiPropertyOptional({ description: 'Ad: image media URL' })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiPropertyOptional({ description: 'Ad: video media URL' })
  @IsOptional()
  @IsString()
  video_url?: string;

  @ApiPropertyOptional({ description: 'Ad: source post ID' })
  @IsOptional()
  @IsString()
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
export class InstagramReferral {
  @ApiPropertyOptional({ description: 'Ad: referral ref string (m.me/ad ref)' })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiPropertyOptional({ description: 'Ad: Meta ad ID' })
  @IsOptional()
  @IsString()
  ad_id?: string;

  @ApiPropertyOptional({ description: 'Ad: referral source (e.g. "ADS")' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Ad: referral type (e.g. "OPEN_THREAD")' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Ad: nested ad context (title, media)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramAdsContextData)
  ads_context_data?: InstagramAdsContextData;
}

export class InstagramMessage {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  mid!: string;

  @ApiPropertyOptional({ description: 'Text content' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Attachments' })
  @IsOptional()
  @IsArray()
  attachments?: InstagramMessageAttachment[];

  @ApiPropertyOptional({ description: 'Quick reply payload' })
  @IsOptional()
  quick_reply?: {
    payload: string;
  };

  @ApiPropertyOptional({ description: 'Reply to message' })
  @IsOptional()
  reply_to?: {
    mid: string;
  };

  @ApiPropertyOptional({ description: 'Is deleted' })
  @IsOptional()
  is_deleted?: boolean;

  @ApiPropertyOptional({ description: 'Is echo' })
  @IsOptional()
  is_echo?: boolean;

  @ApiPropertyOptional({ description: 'App ID (present when sent via API)' })
  @IsOptional()
  app_id?: number;

  @ApiPropertyOptional({ description: 'Is unsupported' })
  @IsOptional()
  is_unsupported?: boolean;

  @ApiPropertyOptional({ description: 'Meta ad referral (ad-originated DM)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramReferral)
  referral?: InstagramReferral;
}

export class InstagramDelivery {
  @ApiProperty({ description: 'Delivered message IDs' })
  @IsArray()
  mids!: string[];

  @ApiProperty({ description: 'Delivery watermark timestamp' })
  watermark!: number;
}

export class InstagramRead {
  @ApiProperty({ description: 'Read watermark timestamp' })
  watermark!: number;
}

export class InstagramReaction {
  @ApiProperty({ description: 'Target message ID' })
  @IsString()
  mid!: string;

  @ApiProperty({ description: 'Reaction action (react/unreact)' })
  @IsString()
  action!: 'react' | 'unreact';

  @ApiPropertyOptional({ description: 'Reaction emoji' })
  @IsOptional()
  @IsString()
  reaction?: string;

  @ApiPropertyOptional({ description: 'Reaction emoji' })
  @IsOptional()
  @IsString()
  emoji?: string;
}

export class InstagramOptin {
  @ApiProperty({ description: 'Optin type (e.g. follow)' })
  @IsString()
  type!: string;
}

export class InstagramMessagingEvent {
  @ApiProperty({ description: 'Sender information' })
  @ValidateNested()
  @Type(() => InstagramSender)
  sender!: InstagramSender;

  @ApiProperty({ description: 'Recipient information' })
  @ValidateNested()
  @Type(() => InstagramRecipient)
  recipient!: InstagramRecipient;

  @ApiProperty({ description: 'Event timestamp' })
  timestamp!: number;

  @ApiPropertyOptional({ description: 'Message event' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramMessage)
  message?: InstagramMessage;

  @ApiPropertyOptional({ description: 'Delivery event' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramDelivery)
  delivery?: InstagramDelivery;

  @ApiPropertyOptional({ description: 'Read event' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramRead)
  read?: InstagramRead;

  @ApiPropertyOptional({ description: 'Reaction event' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramReaction)
  reaction?: InstagramReaction;

  @ApiPropertyOptional({ description: 'Optin event (e.g. user followed)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramOptin)
  optin?: InstagramOptin;

  @ApiPropertyOptional({
    description: 'Standalone Meta ad referral (ad opens thread before any message)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstagramReferral)
  referral?: InstagramReferral;
}

export class InstagramWebhookEntry {
  @ApiProperty({ description: 'Instagram Business Account ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Entry timestamp' })
  time!: number;

  @ApiPropertyOptional({ description: 'Messaging events' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstagramMessagingEvent)
  messaging?: InstagramMessagingEvent[];
}

export class InstagramWebhookDto {
  @ApiProperty({ description: 'Object type (always "instagram")' })
  @IsString()
  object!: 'instagram';

  @ApiProperty({ description: 'Webhook entries' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstagramWebhookEntry)
  entry!: InstagramWebhookEntry[];
}
