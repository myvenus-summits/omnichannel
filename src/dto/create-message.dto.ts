import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import type { MessageContentType } from '../types';

export class CreateMessageDto {
  @ApiProperty({
    description: '메시지 타입',
    enum: ['text', 'image', 'file', 'template'],
    example: 'text',
  })
  @IsEnum(['text', 'image', 'video', 'file', 'template'])
  contentType!: MessageContentType;

  @ApiPropertyOptional({
    description: '텍스트 내용 (contentType이 text인 경우 필수)',
    example: '안녕하세요, 문의 감사합니다.',
  })
  @ValidateIf((o: CreateMessageDto) => o.contentType === 'text')
  @IsNotEmpty()
  @IsString()
  contentText?: string;

  @ApiPropertyOptional({
    description: '미디어 URL (contentType이 image/file인 경우 필수)',
    example: 'https://example.com/image.jpg',
  })
  @ValidateIf((o: CreateMessageDto) =>
    ['image', 'file'].includes(o.contentType),
  )
  @IsNotEmpty()
  @IsUrl()
  contentMediaUrl?: string;

  @ApiPropertyOptional({
    description: '답장 대상 메시지 ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  replyToMessageId?: number;

  @ApiPropertyOptional({
    description: '템플릿 ID (contentType이 template인 경우 필수)',
    example: 'welcome_template',
  })
  @ValidateIf((o: CreateMessageDto) => o.contentType === 'template')
  @IsNotEmpty()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({
    description: '템플릿 변수 (contentType이 template인 경우)',
    example: { name: '홍길동', clinic: '마이비너스' },
  })
  @ValidateIf((o: CreateMessageDto) => o.contentType === 'template')
  @IsOptional()
  templateVariables?: Record<string, string>;
}
