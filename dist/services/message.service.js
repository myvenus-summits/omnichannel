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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("../entities/message.entity");
const conversation_entity_1 = require("../entities/conversation.entity");
const whatsapp_adapter_1 = require("../adapters/whatsapp.adapter");
const conversation_service_1 = require("./conversation.service");
let MessageService = MessageService_1 = class MessageService {
    messageRepository;
    conversationRepository;
    whatsappAdapter;
    conversationService;
    logger = new common_1.Logger(MessageService_1.name);
    constructor(messageRepository, conversationRepository, whatsappAdapter, conversationService) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.whatsappAdapter = whatsappAdapter;
        this.conversationService = conversationService;
    }
    async findByConversation(conversationId, options) {
        const queryBuilder = this.messageRepository
            .createQueryBuilder('message')
            .where('message.conversationId = :conversationId', { conversationId })
            .orderBy('message.createdAt', 'DESC');
        if (options?.before) {
            const beforeMessage = await this.messageRepository.findOne({
                where: { id: Number(options.before) },
            });
            if (beforeMessage) {
                queryBuilder.andWhere('message.createdAt < :beforeDate', {
                    beforeDate: beforeMessage.createdAt,
                });
            }
        }
        if (options?.limit) {
            queryBuilder.take(options.limit);
        }
        else {
            queryBuilder.take(50);
        }
        const messages = await queryBuilder.getMany();
        return messages.reverse();
    }
    async findOne(id) {
        const message = await this.messageRepository.findOne({
            where: { id },
            relations: ['conversation'],
        });
        if (!message) {
            throw new common_1.NotFoundException(`Message #${id} not found`);
        }
        return message;
    }
    async create(data) {
        const message = this.messageRepository.create(data);
        return this.messageRepository.save(message);
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
            contentText: dto.contentText,
            contentMediaUrl: dto.contentMediaUrl,
            status: 'sent',
        });
        await this.conversationService.updateLastMessage(conversationId, dto.contentText?.substring(0, 100) ?? '[Media]', new Date());
        return message;
    }
    async createFromWebhook(conversationId, data) {
        const existing = await this.messageRepository.findOne({
            where: { channelMessageId: data.channelMessageId },
        });
        if (existing) {
            this.logger.log(`Message ${data.channelMessageId} already exists`);
            return existing;
        }
        const message = await this.create({
            conversationId,
            channelMessageId: data.channelMessageId,
            direction: data.direction,
            senderName: data.senderName,
            contentType: data.contentType,
            contentText: data.contentText,
            contentMediaUrl: data.contentMediaUrl,
            status: 'delivered',
            metadata: data.metadata,
        });
        if (data.direction === 'inbound') {
            await this.conversationService.incrementUnreadCount(conversationId);
        }
        await this.conversationService.updateLastMessage(conversationId, data.contentText?.substring(0, 100) ?? '[Media]', data.timestamp);
        return message;
    }
    async updateStatus(channelMessageId, status) {
        await this.messageRepository.update({ channelMessageId }, { status });
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = MessageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(1, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        whatsapp_adapter_1.WhatsAppAdapter,
        conversation_service_1.ConversationService])
], MessageService);
//# sourceMappingURL=message.service.js.map