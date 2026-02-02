import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import type { IMessageTemplate, ITemplateHistory, IMessageTemplateRepository, ITemplateHistoryRepository, TemplateStatus, TemplateHistoryStatus, CreateTemplateData, UpdateTemplateData, SendTemplateData } from '../interfaces';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
export declare class TemplateService {
    private readonly templateRepository;
    private readonly historyRepository;
    private readonly whatsappAdapter;
    private readonly omnichannelGateway;
    private readonly logger;
    constructor(templateRepository: IMessageTemplateRepository | null, historyRepository: ITemplateHistoryRepository | null, whatsappAdapter: WhatsAppAdapter | null, omnichannelGateway: OmnichannelGateway | null);
    /**
     * 템플릿 목록 조회
     */
    findAll(params?: {
        status?: TemplateStatus;
        category?: string;
        search?: string;
    }): Promise<IMessageTemplate[]>;
    /**
     * 템플릿 상세 조회
     */
    findOne(id: number): Promise<IMessageTemplate>;
    /**
     * 템플릿 생성
     */
    create(data: CreateTemplateData): Promise<IMessageTemplate>;
    /**
     * 템플릿 수정
     */
    update(id: number, data: UpdateTemplateData): Promise<IMessageTemplate>;
    /**
     * 템플릿 삭제
     */
    delete(id: number): Promise<void>;
    /**
     * 템플릿 메시지 발송
     */
    send(templateId: number, data: SendTemplateData): Promise<ITemplateHistory>;
    /**
     * 발송 히스토리 조회
     */
    getHistory(params?: {
        templateId?: number;
        status?: TemplateHistoryStatus;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: ITemplateHistory[];
        total: number;
    }>;
    /**
     * 히스토리 상태 업데이트 (webhook에서 호출)
     */
    updateHistoryStatus(channelMessageId: string, status: TemplateHistoryStatus, errorMessage?: string): Promise<void>;
    /**
     * 콘텐츠에서 변수 추출 ({{variable}} 형식)
     */
    private extractVariables;
}
//# sourceMappingURL=template.service.d.ts.map