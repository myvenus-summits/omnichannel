import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Twilio Webhook Payload
 * https://www.twilio.com/docs/conversations/conversations-webhooks
 */
export class TwilioWebhookDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  EventType!: string;

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
