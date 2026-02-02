import { TemplateService } from '../services/template.service';
import type { CreateMessageTemplateDto, UpdateMessageTemplateDto, SendTemplateDto, TemplateHistoryFilterDto } from '../dto';
import type { TemplateStatus } from '../interfaces';
export declare class TemplateController {
    private readonly templateService;
    private readonly logger;
    constructor(templateService: TemplateService);
    /**
     * GET /omnichannel/templates
     * 템플릿 목록 조회
     */
    findAll(status?: TemplateStatus, category?: string, search?: string): Promise<{
        data: import("../interfaces").IMessageTemplate[];
    }>;
    /**
     * GET /omnichannel/templates/history
     * 발송 히스토리 조회
     */
    getHistory(query: TemplateHistoryFilterDto): Promise<{
        data: import("../interfaces").ITemplateHistory[];
        meta: {
            total: number;
        };
    }>;
    /**
     * GET /omnichannel/templates/:id
     * 템플릿 상세 조회
     */
    findOne(id: number): Promise<{
        data: import("../interfaces").IMessageTemplate;
    }>;
    /**
     * POST /omnichannel/templates
     * 템플릿 생성
     */
    create(dto: CreateMessageTemplateDto): Promise<{
        data: import("../interfaces").IMessageTemplate;
    }>;
    /**
     * PATCH /omnichannel/templates/:id
     * 템플릿 수정
     */
    update(id: number, dto: UpdateMessageTemplateDto): Promise<{
        data: import("../interfaces").IMessageTemplate;
    }>;
    /**
     * DELETE /omnichannel/templates/:id
     * 템플릿 삭제
     */
    delete(id: number): Promise<void>;
    /**
     * POST /omnichannel/templates/:id/send
     * 템플릿 메시지 발송
     */
    send(id: number, dto: SendTemplateDto): Promise<{
        data: import("../interfaces").ITemplateHistory;
    }>;
}
//# sourceMappingURL=template.controller.d.ts.map