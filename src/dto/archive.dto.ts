import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ArchiveFilterDto {
  @ApiPropertyOptional({ description: '며칠 이상 된 대화를 아카이브할지 (기본: 90)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  daysOld?: number = 90;

  @ApiPropertyOptional({ description: '최대 처리 개수 (기본: 100)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 100;
}

export interface ArchiveData {
  archivedAt: Date;
  conversation: {
    id: number;
    channel: string;
    contactIdentifier: string;
    contactName: string | null;
    customerId: number | null;
    status: string;
    tags: string[];
    assignedUserId: number | null;
    createdAt: Date;
    closedAt: Date | null;
    metadata: Record<string, unknown> | null;
  };
  messages: Array<{
    id: number;
    direction: string;
    senderName: string | null;
    contentType: string;
    contentText: string | null;
    contentMediaUrl: string | null;
    timestamp: Date;
    metadata: Record<string, unknown> | null;
  }>;
  memos?: Array<{
    content: string;
    createdAt: Date;
  }>;
  stats: {
    totalMessages: number;
    dateRange: {
      from: Date;
      to: Date;
    };
  };
}

export interface ArchiveResult {
  conversationId: number;
  archiveUrl: string;
  messageCount: number;
  archivedAt: Date;
}

export interface ArchivedConversationRecord {
  id?: number;
  originalConversationId: number;
  customerId: number | null;
  channel: string;
  contactName: string | null;
  archiveUrl: string;
  messageCount: number;
  dateFrom: Date;
  dateTo: Date;
  archivedAt: Date;
}
