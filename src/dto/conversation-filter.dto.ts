import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import type { ChannelType, ConversationStatus } from '../types';

export class ConversationFilterDto {
  @ApiPropertyOptional({
    description: '채널 필터',
    enum: ['whatsapp', 'instagram', 'line'],
  })
  @IsOptional()
  @IsEnum(['whatsapp', 'instagram', 'line'])
  channel?: ChannelType;

  @ApiPropertyOptional({
    description: '상태 필터',
    enum: ['open', 'closed', 'snoozed'],
    default: 'open',
  })
  @IsOptional()
  @IsEnum(['open', 'closed', 'snoozed'])
  status?: ConversationStatus;

  @ApiPropertyOptional({
    description: '담당자 ID 필터',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  assignedUserId?: number;

  @ApiPropertyOptional({
    description: '배정되지 않은 대화만 조회',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unassigned?: boolean;

  @ApiPropertyOptional({
    description: '태그 필터 (복수 가능)',
    type: [String],
    example: ['urgent', 'vip'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : (value as string[]),
  )
  tags?: string[];

  @ApiPropertyOptional({
    description: '검색어 (고객명, 전화번호)',
    example: '홍길동',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '병원 ID 필터 (멀티테넌트)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  clinicId?: number;

  @ApiPropertyOptional({
    description: '프로젝트별 커스텀 필터 (JSON string)',
    example: '{"regionId":"indonesia"}',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return {}; }
    }
    return value ?? {};
  })
  customFilters?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: '채널 설정 ID 필터',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  channelConfigId?: number;

  @ApiPropertyOptional({
    description: '언어 필터 (단일)',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: '채널 필터 (복수)',
    type: [String],
    example: ['whatsapp', 'instagram'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : (value as string[]),
  )
  channels?: string[];

  @ApiPropertyOptional({
    description: '언어 필터 (복수)',
    type: [String],
    example: ['en', 'id'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : (value as string[]),
  )
  languages?: string[];

  @ApiPropertyOptional({
    description: '예약 배지 필터 (COMPLETED, CONFIRMED, IN_PROGRESS)',
    enum: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'],
  })
  @IsOptional()
  @IsString()
  reservationBadge?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 개수',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AssignDto {
  @ApiPropertyOptional({
    description: '담당자 ID (null이면 배정 해제)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number | null;
}

export class UpdateTagsDto {
  @ApiPropertyOptional({
    description: '태그 목록',
    type: [String],
    example: ['urgent', 'vip'],
  })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

export class UpdateStatusDto {
  @ApiPropertyOptional({
    description: '상태',
    enum: ['open', 'closed', 'snoozed'],
  })
  @IsEnum(['open', 'closed', 'snoozed'])
  status!: ConversationStatus;
}
