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
var OmnichannelGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmnichannelGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let OmnichannelGateway = OmnichannelGateway_1 = class OmnichannelGateway {
    logger = new common_1.Logger(OmnichannelGateway_1.name);
    server;
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    /**
     * 새 메시지 이벤트 발송
     */
    emitNewMessage(conversationId, message) {
        this.server.emit(`conversation:${conversationId}:message`, {
            conversationId,
            message: {
                id: message.id,
                direction: message.direction,
                senderName: message.senderName,
                contentType: message.contentType,
                contentText: message.contentText,
                contentMediaUrl: message.contentMediaUrl,
                status: message.status,
                createdAt: message.createdAt,
            },
        });
        this.logger.debug(`Emitted new message for conversation ${conversationId}`);
    }
    /**
     * 대화 목록 업데이트 (새 대화 생성 또는 메타데이터 변경)
     */
    emitConversationUpdate(conversation) {
        this.server.emit('conversation:update', {
            id: conversation.id,
            channel: conversation.channel,
            contactIdentifier: conversation.contactIdentifier,
            contactName: conversation.contactName,
            status: conversation.status,
            lastMessageAt: conversation.lastMessageAt,
            lastMessagePreview: conversation.lastMessagePreview,
            unreadCount: conversation.unreadCount,
        });
        this.logger.debug(`Emitted conversation update for ${conversation.id}`);
    }
    /**
     * 대화 상태 변경 알림 (open/closed/archived)
     */
    emitConversationStatusChange(conversationId, status) {
        this.server.emit(`conversation:${conversationId}:status`, {
            conversationId,
            status,
        });
    }
};
exports.OmnichannelGateway = OmnichannelGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], OmnichannelGateway.prototype, "server", void 0);
exports.OmnichannelGateway = OmnichannelGateway = OmnichannelGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'omnichannel',
        cors: {
            origin: '*',
            credentials: true,
        },
    })
], OmnichannelGateway);
//# sourceMappingURL=omnichannel.gateway.js.map