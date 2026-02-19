import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import {
  ConversationFilterDto,
  AssignDto,
  UpdateTagsDto,
  UpdateStatusDto,
  CreateMessageDto,
} from '../dto';

@ApiTags('Omnichannel - Conversations')
@ApiBearerAuth()
@Controller('omnichannel/conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  @Get()
  @ApiOperation({ summary: '대화 목록 조회' })
  @ApiResponse({ status: 200, description: '대화 목록 반환' })
  async findAll(@Query() filter: ConversationFilterDto) {
    return this.conversationService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: '대화 상세 조회' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 200, description: '대화 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '대화를 찾을 수 없음' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.findOne(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: '대화 메시지 조회' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiQuery({ name: 'limit', required: false, description: '조회 개수' })
  @ApiQuery({
    name: 'before',
    required: false,
    description: '이 메시지 ID 이전 메시지 조회',
  })
  @ApiResponse({ status: 200, description: '메시지 목록 반환' })
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    await this.conversationService.findOne(id);

    return this.messageService.findByConversation(id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      before,
    });
  }

  @Post(':id/messages')
  @ApiOperation({ summary: '메시지 발송' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 201, description: '메시지 발송 성공' })
  @ApiResponse({ status: 404, description: '대화를 찾을 수 없음' })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMessageDto,
    @Req() req: any,
  ) {
    return this.messageService.sendMessage(id, dto, req.user?.id, req.user?.name);
  }

  @Post(':id/messages/:messageId/resend')
  @ApiOperation({ summary: '실패한 메시지 재전송' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiParam({ name: 'messageId', description: '메시지 ID' })
  @ApiResponse({ status: 201, description: '메시지 재전송 성공' })
  @ApiResponse({ status: 400, description: '재전송 불가 (실패 상태가 아님)' })
  @ApiResponse({ status: 404, description: '메시지를 찾을 수 없음' })
  async resendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    await this.conversationService.findOne(id);
    return this.messageService.resendMessage(messageId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: '담당자 배정' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 200, description: '담당자 배정 완료' })
  @ApiResponse({ status: 404, description: '대화를 찾을 수 없음' })
  async assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignDto) {
    return this.conversationService.assign(id, dto);
  }

  @Patch(':id/tags')
  @ApiOperation({ summary: '태그 수정' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 200, description: '태그 수정 완료' })
  @ApiResponse({ status: 404, description: '대화를 찾을 수 없음' })
  async updateTags(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTagsDto,
  ) {
    return this.conversationService.updateTags(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '상태 변경 (open/closed/snoozed)' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 200, description: '상태 변경 완료' })
  @ApiResponse({ status: 404, description: '대화를 찾을 수 없음' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.conversationService.updateStatus(id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '읽음 처리' })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 200, description: '읽음 처리 완료' })
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.markAsRead(id);
  }
}
