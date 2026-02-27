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
var ConversationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const conversation_service_1 = require("../services/conversation.service");
const message_service_1 = require("../services/message.service");
const omnichannel_gateway_1 = require("../gateways/omnichannel.gateway");
const dto_1 = require("../dto");
let ConversationController = ConversationController_1 = class ConversationController {
    conversationService;
    messageService;
    omnichannelGateway;
    logger = new common_1.Logger(ConversationController_1.name);
    constructor(conversationService, messageService, omnichannelGateway) {
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.omnichannelGateway = omnichannelGateway;
    }
    async findAll(filter) {
        return this.conversationService.findAll(filter);
    }
    async findOne(id) {
        return this.conversationService.findOne(id);
    }
    async getMessages(id, limit, before) {
        await this.conversationService.findOne(id);
        return this.messageService.findByConversation(id, {
            limit: limit ? parseInt(limit, 10) : undefined,
            before,
        });
    }
    async sendMessage(id, dto, req) {
        const message = await this.messageService.sendMessage(id, dto, req.user?.id, req.user?.name);
        // 소켓 브로드캐스트 — 다른 CRM 세션에 실시간 동기화
        // try/catch로 감싸서 emit 실패가 HTTP 응답에 영향 주지 않도록 함
        try {
            const conversation = await this.conversationService.findOne(id);
            this.omnichannelGateway.emitNewMessage(id, message);
            this.omnichannelGateway.emitConversationUpdate(conversation);
        }
        catch (err) {
            this.logger.warn(`Failed to broadcast message ${message.id}: ${err}`);
        }
        return message;
    }
    async resendMessage(id, messageId) {
        await this.conversationService.findOne(id);
        return this.messageService.resendMessage(messageId);
    }
    async assign(id, dto) {
        return this.conversationService.assign(id, dto);
    }
    async updateTags(id, dto) {
        return this.conversationService.updateTags(id, dto);
    }
    async updateStatus(id, dto) {
        return this.conversationService.updateStatus(id, dto);
    }
    async markAsRead(id) {
        return this.conversationService.markAsRead(id);
    }
};
exports.ConversationController = ConversationController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '대화 목록 조회' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '대화 목록 반환' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ConversationFilterDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '대화 상세 조회' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '대화 상세 정보 반환' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '대화를 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    (0, swagger_1.ApiOperation)({ summary: '대화 메시지 조회' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '조회 개수' }),
    (0, swagger_1.ApiQuery)({
        name: 'before',
        required: false,
        description: '이 메시지 ID 이전 메시지 조회',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '메시지 목록 반환' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('before')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    (0, swagger_1.ApiOperation)({ summary: '메시지 발송' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '메시지 발송 성공' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '대화를 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)(':id/messages/:messageId/resend'),
    (0, swagger_1.ApiOperation)({ summary: '실패한 메시지 재전송' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiParam)({ name: 'messageId', description: '메시지 ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '메시지 재전송 성공' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '재전송 불가 (실패 상태가 아님)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '메시지를 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('messageId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "resendMessage", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, swagger_1.ApiOperation)({ summary: '담당자 배정' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '담당자 배정 완료' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '대화를 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.AssignDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "assign", null);
__decorate([
    (0, common_1.Patch)(':id/tags'),
    (0, swagger_1.ApiOperation)({ summary: '태그 수정' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '태그 수정 완료' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '대화를 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateTagsDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "updateTags", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '상태 변경 (open/closed/snoozed)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '상태 변경 완료' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '대화를 찾을 수 없음' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: '읽음 처리' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '대화 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '읽음 처리 완료' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "markAsRead", null);
exports.ConversationController = ConversationController = ConversationController_1 = __decorate([
    (0, swagger_1.ApiTags)('Omnichannel - Conversations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('omnichannel/conversations'),
    __metadata("design:paramtypes", [conversation_service_1.ConversationService,
        message_service_1.MessageService,
        omnichannel_gateway_1.OmnichannelGateway])
], ConversationController);
//# sourceMappingURL=conversation.controller.js.map