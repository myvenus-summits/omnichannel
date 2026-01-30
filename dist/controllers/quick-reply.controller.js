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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickReplyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const quick_reply_service_1 = require("../services/quick-reply.service");
const dto_1 = require("../dto");
let QuickReplyController = class QuickReplyController {
    quickReplyService;
    constructor(quickReplyService) {
        this.quickReplyService = quickReplyService;
    }
    async findAll(query) {
        return this.quickReplyService.findAll(query);
    }
    async findOne(id) {
        return this.quickReplyService.findOne(id);
    }
    async create(dto) {
        return this.quickReplyService.create(dto);
    }
    async update(id, dto) {
        return this.quickReplyService.update(id, dto);
    }
    async delete(id) {
        return this.quickReplyService.delete(id);
    }
    async incrementUsage(id) {
        return this.quickReplyService.incrementUsage(id);
    }
};
exports.QuickReplyController = QuickReplyController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '빠른 답변 목록 조회' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '빠른 답변 목록 반환' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuickReplyQueryDto]),
    __metadata("design:returntype", Promise)
], QuickReplyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '빠른 답변 상세 조회' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '빠른 답변 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '빠른 답변 상세 정보 반환' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '빠른 답변을 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], QuickReplyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '빠른 답변 생성' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '빠른 답변 생성 완료' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateQuickReplyDto]),
    __metadata("design:returntype", Promise)
], QuickReplyController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '빠른 답변 수정' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '빠른 답변 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '빠른 답변 수정 완료' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '빠른 답변을 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateQuickReplyDto]),
    __metadata("design:returntype", Promise)
], QuickReplyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '빠른 답변 삭제' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '빠른 답변 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '빠른 답변 삭제 완료' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '빠른 답변을 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], QuickReplyController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/use'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '빠른 답변 사용 횟수 증가' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '빠른 답변 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '사용 횟수 증가 완료' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], QuickReplyController.prototype, "incrementUsage", null);
exports.QuickReplyController = QuickReplyController = __decorate([
    (0, swagger_1.ApiTags)('Omnichannel - Quick Replies'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('omnichannel/quick-replies'),
    __metadata("design:paramtypes", [quick_reply_service_1.QuickReplyService])
], QuickReplyController);
//# sourceMappingURL=quick-reply.controller.js.map