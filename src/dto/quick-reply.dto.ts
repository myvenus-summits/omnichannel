import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateQuickReplyDto {
  @ApiProperty({ description: '템플릿 제목', example: '예약 확인' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: '템플릿 내용',
    example: '안녕하세요! 예약이 확인되었습니다. 감사합니다.',
  })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({
    description: '단축키 (슬래시 명령어)',
    example: '/예약',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  shortcut?: string;
}

export class UpdateQuickReplyDto extends PartialType(CreateQuickReplyDto) {
  @ApiPropertyOptional({ description: '활성화 여부' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QuickReplyQueryDto {
  @ApiPropertyOptional({ description: '검색어 (제목, 내용, 단축키)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '활성화된 것만 조회', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}
