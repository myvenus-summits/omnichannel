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
var MessageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("../interfaces");
const whatsapp_adapter_1 = require("../adapters/whatsapp.adapter");
const conversation_service_1 = require("./conversation.service");
let MessageService = MessageService_1 = class MessageService {
    messageRepository;
    whatsappAdapter;
    conversationService;
    logger = new common_1.Logger(MessageService_1.name);
    constructor(messageRepository, whatsappAdapter, conversationService) {
        this.messageRepository = messageRepository;
        this.whatsappAdapter = whatsappAdapter;
        this.conversationService = conversationService;
    }
    async findByConversation(conversationId, options) {
        return this.messageRepository.findByConversation(conversationId, options);
    }
    async findOne(id) {
        const message = await this.messageRepository.findOne(id);
        if (!message) {
            throw new common_1.NotFoundException(`Message #${id} not found`);
        }
        return message;
    }
    async create(data) {
        return this.messageRepository.create(data);
    }
    async sendMessage(conversationId, dto, senderUserId) {
        const conversation = await this.conversationService.findOne(conversationId);
        let result;
        if (dto.contentType === 'template' && dto.templateId) {
            result = await this.whatsappAdapter.sendTemplateMessage(conversation.contactIdentifier, dto.templateId, dto.templateVariables ?? {});
        }
        else {
            const messageType = dto.contentType === 'text'
                ? 'text'
                : dto.contentType === 'image'
                    ? 'image'
                    : 'file';
            result = await this.whatsappAdapter.sendMessage(conversation.contactIdentifier, {
                type: messageType,
                text: dto.contentText,
                mediaUrl: dto.contentMediaUrl,
            });
        }
        if (!result.success) {
            throw new Error(`Failed to send message: ${result.error}`);
        }
        const message = await this.create({
            conversationId,
            channelMessageId: result.channelMessageId ?? `local-${Date.now()}`,
            direction: 'outbound',
            senderUserId,
            contentType: dto.contentType,
            contentText: dto.contentText ?? null,
            contentMediaUrl: dto.contentMediaUrl ?? null,
            status: 'sent',
            senderName: null,
            metadata: null,
        });
        await this.conversationService.updateLastMessage(conversationId, dto.contentText?.substring(0, 100) ?? '[Media]', new Date());
        return message;
    }
    async createFromWebhook(conversationId, data) {
        const existing = await this.messageRepository.findByChannelMessageId(data.channelMessageId);
        if (existing) {
            this.logger.log(`Message ${data.channelMessageId} already exists`);
            return existing;
        }
        const message = await this.create({
            conversationId,
            channelMessageId: data.channelMessageId,
            direction: data.direction,
            senderName: data.senderName ?? null,
            contentType: data.contentType,
            contentText: data.contentText ?? null,
            contentMediaUrl: data.contentMediaUrl ?? null,
            status: 'delivered',
            metadata: data.metadata ?? null,
            senderUserId: null,
        });
        if (data.direction === 'inbound') {
            await this.conversationService.incrementUnreadCount(conversationId);
        }
        await this.conversationService.updateLastMessage(conversationId, data.contentText?.substring(0, 100) ?? '[Media]', data.timestamp);
        return message;
    }
    async updateStatus(channelMessageId, status) {
        await this.messageRepository.updateStatus(channelMessageId, status);
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = MessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(interfaces_1.MESSAGE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, whatsapp_adapter_1.WhatsAppAdapter,
        conversation_service_1.ConversationService])
], MessageService);
//# sourceMappingURL=message.service.js.map