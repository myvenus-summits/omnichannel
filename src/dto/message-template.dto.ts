import { IsString, IsOptional, IsArray, IsEnum, IsObject } from 'class-validator';
import type { TemplateStatus } from '../interfaces';

export class CreateMessageTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  content!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  previewText?: string;
}

export class UpdateMessageTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: TemplateStatus;

  @IsString()
  @IsOptional()
  previewText?: string;
}

export class SendTemplateDto {
  @IsString()
  recipientIdentifier!: string; // e.g., whatsapp:+821012345678

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>; // e.g., { customerName: 'John' }

  @IsOptional()
  conversationId?: number;
}

export class TemplateHistoryFilterDto {
  @IsOptional()
  templateId?: number;

  @IsOptional()
  status?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}
