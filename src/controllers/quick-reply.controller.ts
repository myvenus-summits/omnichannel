import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuickReplyService } from '../services/quick-reply.service';
import {
  CreateQuickReplyDto,
  UpdateQuickReplyDto,
  QuickReplyQueryDto,
} from '../dto';

@ApiTags('Omnichannel - Quick Replies')
@ApiBearerAuth()
@Controller('omnichannel/quick-replies')
export class QuickReplyController {
  constructor(private readonly quickReplyService: QuickReplyService) {}

  @Get()
  @ApiOperation({ summary: '빠른 답변 목록 조회' })
  @ApiResponse({ status: 200, description: '빠른 답변 목록 반환' })
  async findAll(@Query() query: QuickReplyQueryDto) {
    return this.quickReplyService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '빠른 답변 상세 조회' })
  @ApiParam({ name: 'id', description: '빠른 답변 ID' })
  @ApiResponse({ status: 200, description: '빠른 답변 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '빠른 답변을 찾을 수 없음' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quickReplyService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '빠른 답변 생성' })
  @ApiResponse({ status: 201, description: '빠른 답변 생성 완료' })
  async create(@Body() dto: CreateQuickReplyDto) {
    return this.quickReplyService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '빠른 답변 수정' })
  @ApiParam({ name: 'id', description: '빠른 답변 ID' })
  @ApiResponse({ status: 200, description: '빠른 답변 수정 완료' })
  @ApiResponse({ status: 404, description: '빠른 답변을 찾을 수 없음' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuickReplyDto,
  ) {
    return this.quickReplyService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '빠른 답변 삭제' })
  @ApiParam({ name: 'id', description: '빠른 답변 ID' })
  @ApiResponse({ status: 204, description: '빠른 답변 삭제 완료' })
  @ApiResponse({ status: 404, description: '빠른 답변을 찾을 수 없음' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.quickReplyService.delete(id);
  }

  @Post(':id/use')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '빠른 답변 사용 횟수 증가' })
  @ApiParam({ name: 'id', description: '빠른 답변 ID' })
  @ApiResponse({ status: 204, description: '사용 횟수 증가 완료' })
  async incrementUsage(@Param('id', ParseIntPipe) id: number) {
    return this.quickReplyService.incrementUsage(id);
  }
}
