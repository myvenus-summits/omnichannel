import { Injectable, Logger, NotFoundException, Inject, Optional } from '@nestjs/common';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import type {
  IMessageTemplate,
  ITemplateHistory,
  IMessageTemplateRepository,
  ITemplateHistoryRepository,
  TemplateStatus,
  TemplateHistoryStatus,
  CreateTemplateData,
  UpdateTemplateData,
  SendTemplateData,
} from '../interfaces';
import {
  MESSAGE_TEMPLATE_REPOSITORY,
  TEMPLATE_HISTORY_REPOSITORY,
  OMNICHANNEL_MODULE_OPTIONS,
  type OmnichannelModuleOptions,
} from '../interfaces';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @Optional()
    @Inject(MESSAGE_TEMPLATE_REPOSITORY)
    private readonly templateRepository: IMessageTemplateRepository | null,
    @Optional()
    @Inject(TEMPLATE_HISTORY_REPOSITORY)
    private readonly historyRepository: ITemplateHistoryRepository | null,
    @Optional()
    private readonly whatsappAdapter: WhatsAppAdapter | null,
    @Optional()
    private readonly omnichannelGateway: OmnichannelGateway | null,
  ) {
    if (!this.templateRepository) {
      this.logger.warn('TemplateService: MESSAGE_TEMPLATE_REPOSITORY not injected');
    }
    if (!this.historyRepository) {
      this.logger.warn('TemplateService: TEMPLATE_HISTORY_REPOSITORY not injected');
    }
  }

  /**
   * 템플릿 목록 조회
   */
  async findAll(params?: {
    status?: TemplateStatus;
    category?: string;
    search?: string;
  }): Promise<IMessageTemplate[]> {
    if (!this.templateRepository) {
      throw new Error('Template repository not configured');
    }
    return this.templateRepository.findAll(params);
  }

  /**
   * 템플릿 상세 조회
   */
  async findOne(id: number): Promise<IMessageTemplate> {
    if (!this.templateRepository) {
      throw new Error('Template repository not configured');
    }

    const template = await this.templateRepository.findOne(id);
    if (!template) {
      throw new NotFoundException(`Template #${id} not found`);
    }
    return template;
  }

  /**
   * 템플릿 생성
   */
  async create(data: CreateTemplateData): Promise<IMessageTemplate> {
    if (!this.templateRepository) {
      throw new Error('Template repository not configured');
    }

    // 변수 자동 추출 ({{variable}} 형식)
    const variables = data.variables ?? this.extractVariables(data.content);

    return this.templateRepository.create({
      name: data.name,
      content: data.content,
      variables,
      category: data.category ?? null,
      status: 'active',
      previewText: data.previewText ?? null,
    });
  }

  /**
   * 템플릿 수정
   */
  async update(id: number, data: UpdateTemplateData): Promise<IMessageTemplate> {
    if (!this.templateRepository) {
      throw new Error('Template repository not configured');
    }

    await this.findOne(id); // Check if exists

    // 변수 자동 추출 (content가 변경된 경우)
    let variables = data.variables;
    if (data.content && !variables) {
      variables = this.extractVariables(data.content);
    }

    return this.templateRepository.update(id, {
      ...data,
      ...(variables && { variables }),
    });
  }

  /**
   * 템플릿 삭제
   */
  async delete(id: number): Promise<void> {
    if (!this.templateRepository) {
      throw new Error('Template repository not configured');
    }

    await this.findOne(id); // Check if exists
    await this.templateRepository.delete(id);
  }

  /**
   * 템플릿 메시지 발송
   */
  async send(templateId: number, data: SendTemplateData): Promise<ITemplateHistory> {
    if (!this.templateRepository || !this.historyRepository) {
      throw new Error('Template repositories not configured');
    }

    if (!this.whatsappAdapter) {
      throw new Error('WhatsApp adapter not configured');
    }

    const template = await this.findOne(templateId);

    // 발송
    const result = await this.whatsappAdapter.sendTemplateMessage(
      data.recipientIdentifier,
      template.content,
      data.variables ?? {},
    );

    // 히스토리 저장
    const history = await this.historyRepository.create({
      templateId,
      conversationId: data.conversationId ?? null,
      recipientIdentifier: data.recipientIdentifier,
      variables: data.variables ?? {},
      status: result.success ? 'sent' : 'failed',
      channelMessageId: result.channelMessageId ?? null,
      errorMessage: result.error ?? null,
    });

    // 실패 시 에러 던지기
    if (!result.success) {
      throw new Error(`Failed to send template: ${result.error}`);
    }

    this.logger.log(`Template #${templateId} sent to ${data.recipientIdentifier}`);

    return history;
  }

  /**
   * 발송 히스토리 조회
   */
  async getHistory(params?: {
    templateId?: number;
    status?: TemplateHistoryStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ITemplateHistory[]; total: number }> {
    if (!this.historyRepository) {
      throw new Error('Template history repository not configured');
    }

    return this.historyRepository.findAll(params);
  }

  /**
   * 히스토리 상태 업데이트 (webhook에서 호출)
   */
  async updateHistoryStatus(
    channelMessageId: string,
    status: TemplateHistoryStatus,
    errorMessage?: string,
  ): Promise<void> {
    if (!this.historyRepository) {
      return;
    }

    const history = await this.historyRepository.findByChannelMessageId(channelMessageId);
    if (history) {
      await this.historyRepository.updateStatus(history.id, status, errorMessage);
      this.logger.log(`Template history ${history.id} status updated to ${status}`);
    }
  }

  /**
   * 콘텐츠에서 변수 추출 ({{variable}} 형식)
   */
  private extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }
}
