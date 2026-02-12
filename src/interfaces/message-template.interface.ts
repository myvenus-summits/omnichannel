export type TemplateStatus = 'active' | 'inactive';
export type TemplateHistoryStatus = 'sent' | 'delivered' | 'read' | 'failed';

/**
 * 메시지 템플릿 인터페이스
 */
export interface IMessageTemplate {
  id: number;
  name: string;
  content: string;
  variables: string[];
  category: string | null;
  status: TemplateStatus;
  previewText: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 템플릿 발송 히스토리 인터페이스
 */
export interface ITemplateHistory {
  id: number;
  templateId: number;
  template?: IMessageTemplate;
  conversationId: number | null;
  recipientIdentifier: string;
  variables: Record<string, string>;
  status: TemplateHistoryStatus;
  channelMessageId: string | null;
  errorMessage: string | null;
  sentAt: Date;
}

/**
 * 템플릿 생성 데이터
 */
export interface CreateTemplateData {
  name: string;
  content: string;
  variables?: string[];
  category?: string;
  previewText?: string;
}

/**
 * 템플릿 수정 데이터
 */
export interface UpdateTemplateData {
  name?: string;
  content?: string;
  variables?: string[];
  category?: string;
  status?: TemplateStatus;
  previewText?: string;
}

/**
 * 템플릿 발송 데이터
 */
export interface SendTemplateData {
  recipientIdentifier: string;
  variables?: Record<string, string>;
  conversationId?: number;
}

/**
 * MessageTemplate Repository 인터페이스
 */
export interface IMessageTemplateRepository {
  findAll(params?: {
    status?: TemplateStatus;
    category?: string;
    search?: string;
  }): Promise<IMessageTemplate[]>;
  findOne(id: number): Promise<IMessageTemplate | null>;
  create(data: Partial<IMessageTemplate>): Promise<IMessageTemplate>;
  update(id: number, data: Partial<IMessageTemplate>): Promise<IMessageTemplate>;
  delete(id: number): Promise<void>;
}

/**
 * TemplateHistory Repository 인터페이스
 */
export interface ITemplateHistoryRepository {
  findByTemplate(templateId: number, params?: {
    limit?: number;
    offset?: number;
  }): Promise<ITemplateHistory[]>;
  findByConversation(conversationId: number): Promise<ITemplateHistory[]>;
  findAll(params?: {
    templateId?: number;
    status?: TemplateHistoryStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ITemplateHistory[]; total: number }>;
  findOne(id: number): Promise<ITemplateHistory | null>;
  findByChannelMessageId(channelMessageId: string): Promise<ITemplateHistory | null>;
  create(data: Partial<ITemplateHistory>): Promise<ITemplateHistory>;
  updateStatus(id: number, status: TemplateHistoryStatus, errorMessage?: string): Promise<void>;
}

/**
 * Repository injection tokens
 */
export const MESSAGE_TEMPLATE_REPOSITORY = 'MESSAGE_TEMPLATE_REPOSITORY';
export const TEMPLATE_HISTORY_REPOSITORY = 'TEMPLATE_HISTORY_REPOSITORY';
