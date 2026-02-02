import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TemplateService } from '../services/template.service';
import type {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  SendTemplateDto,
  TemplateHistoryFilterDto,
} from '../dto';
import type { TemplateStatus, TemplateHistoryStatus } from '../interfaces';

@Controller('omnichannel/templates')
export class TemplateController {
  private readonly logger = new Logger(TemplateController.name);

  constructor(private readonly templateService: TemplateService) {}

  /**
   * GET /omnichannel/templates
   * 템플릿 목록 조회
   */
  @Get()
  async findAll(
    @Query('status') status?: TemplateStatus,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const templates = await this.templateService.findAll({ status, category, search });
    return { data: templates };
  }

  /**
   * GET /omnichannel/templates/history
   * 발송 히스토리 조회
   */
  @Get('history')
  async getHistory(@Query() query: TemplateHistoryFilterDto) {
    const result = await this.templateService.getHistory({
      templateId: query.templateId,
      status: query.status as TemplateHistoryStatus,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
    return {
      data: result.data,
      meta: { total: result.total },
    };
  }

  /**
   * GET /omnichannel/templates/:id
   * 템플릿 상세 조회
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const template = await this.templateService.findOne(id);
    return { data: template };
  }

  /**
   * POST /omnichannel/templates
   * 템플릿 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMessageTemplateDto) {
    const template = await this.templateService.create(dto);
    return { data: template };
  }

  /**
   * PATCH /omnichannel/templates/:id
   * 템플릿 수정
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    const template = await this.templateService.update(id, dto);
    return { data: template };
  }

  /**
   * DELETE /omnichannel/templates/:id
   * 템플릿 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.templateService.delete(id);
  }

  /**
   * POST /omnichannel/templates/:id/send
   * 템플릿 메시지 발송
   */
  @Post(':id/send')
  async send(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendTemplateDto,
  ) {
    const history = await this.templateService.send(id, {
      recipientIdentifier: dto.recipientIdentifier,
      variables: dto.variables,
      conversationId: dto.conversationId,
    });
    return { data: history };
  }
}
