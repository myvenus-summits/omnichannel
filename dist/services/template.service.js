"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("../interfaces");
let TemplateService = TemplateService_1 = class TemplateService {
    templateRepository;
    historyRepository;
    whatsappAdapter;
    omnichannelGateway;
    logger = new common_1.Logger(TemplateService_1.name);
    constructor(templateRepository, historyRepository, whatsappAdapter, omnichannelGateway) {
        this.templateRepository = templateRepository;
        this.historyRepository = historyRepository;
        this.whatsappAdapter = whatsappAdapter;
        this.omnichannelGateway = omnichannelGateway;
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
    async findAll(params) {
        if (!this.templateRepository) {
            throw new Error('Template repository not configured');
        }
        return this.templateRepository.findAll(params);
    }
    /**
     * 템플릿 상세 조회
     */
    async findOne(id) {
        if (!this.templateRepository) {
            throw new Error('Template repository not configured');
        }
        const template = await this.templateRepository.findOne(id);
        if (!template) {
            throw new common_1.NotFoundException(`Template #${id} not found`);
        }
        return template;
    }
    /**
     * 템플릿 생성
     */
    async create(data) {
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
            status: 'draft',
            twilioContentSid: data.twilioContentSid ?? null,
            previewText: data.previewText ?? null,
        });
    }
    /**
     * 템플릿 수정
     */
    async update(id, data) {
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
    async delete(id) {
        if (!this.templateRepository) {
            throw new Error('Template repository not configured');
        }
        await this.findOne(id); // Check if exists
        await this.templateRepository.delete(id);
    }
    /**
     * 템플릿 메시지 발송
     */
    async send(templateId, data) {
        if (!this.templateRepository || !this.historyRepository) {
            throw new Error('Template repositories not configured');
        }
        if (!this.whatsappAdapter) {
            throw new Error('WhatsApp adapter not configured');
        }
        const template = await this.findOne(templateId);
        // Twilio Content SID가 없으면 에러
        if (!template.twilioContentSid) {
            throw new Error('Template does not have a Twilio Content SID');
        }
        // 발송
        const result = await this.whatsappAdapter.sendTemplateMessage(data.recipientIdentifier, template.twilioContentSid, data.variables ?? {});
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
    async getHistory(params) {
        if (!this.historyRepository) {
            throw new Error('Template history repository not configured');
        }
        return this.historyRepository.findAll(params);
    }
    /**
     * 히스토리 상태 업데이트 (webhook에서 호출)
     */
    async updateHistoryStatus(channelMessageId, status, errorMessage) {
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
    extractVariables(content) {
        const regex = /\{\{(\w+)\}\}/g;
        const variables = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        return variables;
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = TemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(interfaces_1.MESSAGE_TEMPLATE_REPOSITORY)),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(interfaces_1.TEMPLATE_HISTORY_REPOSITORY)),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], TemplateService);
//# sourceMappingURL=template.service.js.map