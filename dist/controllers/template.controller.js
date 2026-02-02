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
var TemplateController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
const common_1 = require("@nestjs/common");
const template_service_1 = require("../services/template.service");
let TemplateController = TemplateController_1 = class TemplateController {
    templateService;
    logger = new common_1.Logger(TemplateController_1.name);
    constructor(templateService) {
        this.templateService = templateService;
    }
    /**
     * GET /omnichannel/templates
     * 템플릿 목록 조회
     */
    async findAll(status, category, search) {
        const templates = await this.templateService.findAll({ status, category, search });
        return { data: templates };
    }
    /**
     * GET /omnichannel/templates/history
     * 발송 히스토리 조회
     */
    async getHistory(query) {
        const result = await this.templateService.getHistory({
            templateId: query.templateId,
            status: query.status,
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
    async findOne(id) {
        const template = await this.templateService.findOne(id);
        return { data: template };
    }
    /**
     * POST /omnichannel/templates
     * 템플릿 생성
     */
    async create(dto) {
        const template = await this.templateService.create(dto);
        return { data: template };
    }
    /**
     * PATCH /omnichannel/templates/:id
     * 템플릿 수정
     */
    async update(id, dto) {
        const template = await this.templateService.update(id, dto);
        return { data: template };
    }
    /**
     * DELETE /omnichannel/templates/:id
     * 템플릿 삭제
     */
    async delete(id) {
        await this.templateService.delete(id);
    }
    /**
     * POST /omnichannel/templates/:id/send
     * 템플릿 메시지 발송
     */
    async send(id, dto) {
        const history = await this.templateService.send(id, {
            recipientIdentifier: dto.recipientIdentifier,
            variables: dto.variables,
            conversationId: dto.conversationId,
        });
        return { data: history };
    }
};
exports.TemplateController = TemplateController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Function]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Function]),
    __metadata("design:returntype", Promise)
], TemplateController.prototype, "send", null);
exports.TemplateController = TemplateController = TemplateController_1 = __decorate([
    (0, common_1.Controller)('omnichannel/templates'),
    __metadata("design:paramtypes", [template_service_1.TemplateService])
], TemplateController);
//# sourceMappingURL=template.controller.js.map