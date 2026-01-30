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

  @ApiPropertyOptional({ description: 'Is unsupported' })
  @IsOptional()
  is_unsupported?: boolean;
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
