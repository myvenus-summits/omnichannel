import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Twilio Conversations API Webhook Payload
 * https://www.twilio.com/docs/conversations/conversations-webhooks
 */
export class TwilioWebhookDto {
  @ApiPropertyOptional({ description: 'Event type (Conversations API)' })
  @IsOptional()
  @IsString()
  EventType?: string;

  @ApiPropertyOptional({ description: 'Conversation SID' })
  @IsOptional()
  @IsString()
  ConversationSid?: string;

  @ApiPropertyOptional({ description: 'Message SID' })
  @IsOptional()
  @IsString()
  MessageSid?: string;

  @ApiPropertyOptional({ description: 'Message body' })
  @IsOptional()
  @IsString()
  Body?: string;

  @ApiPropertyOptional({ description: 'Author' })
  @IsOptional()
  @IsString()
  Author?: string;

  @ApiPropertyOptional({ description: 'Participant SID' })
  @IsOptional()
  @IsString()
  ParticipantSid?: string;

  @ApiPropertyOptional({ description: 'Account SID' })
  @IsOptional()
  @IsString()
  AccountSid?: string;

  @ApiPropertyOptional({ description: 'Source' })
  @IsOptional()
  @IsString()
  Source?: string;

  @ApiPropertyOptional({ description: 'Media Content Type' })
  @IsOptional()
  @IsString()
  MediaContentType?: string;

  @ApiPropertyOptional({ description: 'Media URL' })
  @IsOptional()
  @IsString()
  MediaUrl?: string;

  @ApiPropertyOptional({ description: 'Date Created' })
  @IsOptional()
  @IsString()
  DateCreated?: string;

  // ===== Messaging API fields (Sandbox/WhatsApp) =====

  @ApiPropertyOptional({ description: 'SMS Message SID (Messaging API)' })
  @IsOptional()
  @IsString()
  SmsMessageSid?: string;

  @ApiPropertyOptional({ description: 'SMS Status (Messaging API)' })
  @IsOptional()
  @IsString()
  SmsStatus?: string;

  @ApiPropertyOptional({ description: 'From number (Messaging API)' })
  @IsOptional()
  @IsString()
  From?: string;

  @ApiPropertyOptional({ description: 'To number (Messaging API)' })
  @IsOptional()
  @IsString()
  To?: string;

  @ApiPropertyOptional({ description: 'Profile name (Messaging API - WhatsApp)' })
  @IsOptional()
  @IsString()
  ProfileName?: string;

  @ApiPropertyOptional({ description: 'WhatsApp ID (Messaging API)' })
  @IsOptional()
  @IsString()
  WaId?: string;

  @ApiPropertyOptional({ description: 'Number of media attachments' })
  @IsOptional()
  @IsString()
  NumMedia?: string;

  @ApiPropertyOptional({ description: 'Number of segments' })
  @IsOptional()
  @IsString()
  NumSegments?: string;

  @ApiPropertyOptional({ description: 'Button payload (WhatsApp reactions)' })
  @IsOptional()
  @IsString()
  ButtonPayload?: string;

  @ApiPropertyOptional({ description: 'Referral info (WhatsApp ads)' })
  @IsOptional()
  @IsString()
  ReferralNumMedia?: string;

  @ApiPropertyOptional({ description: 'API Version' })
  @IsOptional()
  @IsString()
  ApiVersion?: string;
}

/**
 * Meta Webhook Verification Query
 */
export class MetaVerifyDto {
  @ApiProperty({ description: 'Hub mode' })
  @IsNotEmpty()
  @IsString()
  'hub.mode'!: string;

  @ApiProperty({ description: 'Hub verify token' })
  @IsNotEmpty()
  @IsString()
  'hub.verify_token'!: string;

  @ApiProperty({ description: 'Hub challenge' })
  @IsNotEmpty()
  @IsString()
  'hub.challenge'!: string;
}

/**
 * Meta Webhook Payload (Instagram/Messenger)
 * https://developers.facebook.com/docs/messenger-platform/webhooks
 */
export class MetaWebhookDto {
  @ApiProperty({ description: 'Object type' })
  @IsString()
  object!: string;

  @ApiProperty({ description: 'Entry array' })
  entry!: MetaWebhookEntry[];
}

export class MetaWebhookEntry {
  @ApiProperty({ description: 'Page/IG user ID' })
  id!: string;

  @ApiProperty({ description: 'Timestamp' })
  time!: number;

  @ApiPropertyOptional({ description: 'Messaging events' })
  messaging?: MetaMessagingEvent[];
}

export class MetaMessagingEvent {
  @ApiProperty({ description: 'Sender' })
  sender!: { id: string };

  @ApiProperty({ description: 'Recipient' })
  recipient!: { id: string };

  @ApiProperty({ description: 'Timestamp' })
  timestamp!: number;

  @ApiPropertyOptional({ description: 'Message' })
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
  };

  @ApiPropertyOptional({ description: 'Delivery' })
  delivery?: {
    mids: string[];
    watermark: number;
  };

  @ApiPropertyOptional({ description: 'Read' })
  read?: {
    watermark: number;
  };
}
