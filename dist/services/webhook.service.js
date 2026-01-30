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
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const whatsapp_adapter_1 = require("../adapters/whatsapp.adapter");
const instagram_adapter_1 = require("../adapters/instagram.adapter");
const conversation_service_1 = require("./conversation.service");
const message_service_1 = require("./message.service");
const conversation_entity_1 = require("../entities/conversation.entity");
const message_entity_1 = require("../entities/message.entity");
const interfaces_1 = require("../interfaces");
let WebhookService = WebhookService_1 = class WebhookService {
    options;
    dataSource;
    whatsappAdapter;
    instagramAdapter;
    omnichannelGateway;
    conversationService;
    messageService;
    logger = new common_1.Logger(WebhookService_1.name);
    appUrl;
    metaWebhookVerifyToken;
    constructor(options, dataSource, whatsappAdapter, instagramAdapter, omnichannelGateway, conversationService, messageService) {
        this.options = options;
        this.dataSource = dataSource;
        this.whatsappAdapter = whatsappAdapter;
        this.instagramAdapter = instagramAdapter;
        this.omnichannelGateway = omnichannelGateway;
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.appUrl = options?.appUrl ?? '';
        this.metaWebhookVerifyToken = options?.meta?.webhookVerifyToken ?? '';
    }
    async handleTwilioWebhook(payload) {
        this.logger.log('Processing Twilio webhook');
        const event = this.whatsappAdapter.parseWebhookPayload(payload);
        if (!event) {
            this.logger.warn('Could not parse Twilio webhook payload');
            return;
        }
        await this.processEvent(event, 'whatsapp');
    }
    async handleMetaWebhook(payload) {
        this.logger.log('Processing Meta webhook');
        const metaPayload = payload;
        // Determine if this is Instagram or Messenger webhook
        if (metaPayload.object === 'instagram') {
            await this.handleInstagramWebhook(payload);
        }
        else {
            this.logger.warn(`Unsupported Meta webhook object type: ${metaPayload.object}`);
        }
    }
    async handleInstagramWebhook(payload) {
        this.logger.log('Processing Instagram webhook');
        const event = this.instagramAdapter.parseWebhookPayload(payload);
        if (!event) {
            this.logger.warn('Could not parse Instagram webhook payload');
            return;
        }
        await this.processEvent(event, 'instagram');
    }
    verifyMetaWebhook(verifyToken, challenge) {
        if (verifyToken === this.metaWebhookVerifyToken) {
            return challenge;
        }
        return null;
    }
    async processEvent(event, channel) {
        switch (event.type) {
            case 'message':
                await this.handleMessageEvent(event, channel);
                break;
            case 'status_update':
                await this.handleStatusUpdate(event);
                break;
            case 'conversation_created':
                await this.handleConversationCreated(event, channel);
                break;
            default:
                this.logger.warn(`Unknown event type: ${String(event.type)}`);
        }
    }
    async handleMessageEvent(event, channel) {
        if (!event.message)
            return;
        const result = await this.dataSource.transaction(async (manager) => {
            const conversationRepo = manager.getRepository(conversation_entity_1.Conversation);
            const messageRepo = manager.getRepository(message_entity_1.Message);
            let conversation = await conversationRepo.findOne({
                where: { channelConversationId: event.channelConversationId },
            });
            const isNewConversation = !conversation;
            if (!conversation) {
                conversation = conversationRepo.create({
                    channel,
                    channelConversationId: event.channelConversationId,
                    contactIdentifier: event.contactIdentifier,
                    contactName: event.contactName,
                    status: 'open',
                });
                conversation = await conversationRepo.save(conversation);
                this.logger.log(`Created new conversation: ${conversation.id}`);
            }
            const message = messageRepo.create({
                conversation,
                conversationId: conversation.id,
                channelMessageId: event.message.channelMessageId,
                direction: event.message.direction,
                senderName: event.message.senderName ?? null,
                contentType: event.message.contentType,
                contentText: event.message.contentText ?? null,
                contentMediaUrl: event.message.contentMediaUrl ?? null,
                status: event.message.direction === 'inbound' ? 'delivered' : 'sent',
                metadata: event.message.metadata ?? null,
            });
            const savedMessage = await messageRepo.save(message);
            const newUnreadCount = event.message.direction === 'inbound'
                ? (conversation.unreadCount ?? 0) + 1
                : conversation.unreadCount ?? 0;
            await conversationRepo.update(conversation.id, {
                lastMessageAt: event.message.timestamp,
                lastMessagePreview: event.message.contentText?.substring(0, 100) ?? '[미디어]',
                unreadCount: newUnreadCount,
            });
            const updatedConversation = await conversationRepo.findOne({
                where: { id: conversation.id },
            });
            this.logger.log(`Message saved: ${event.message.channelMessageId} in conversation ${conversation.id}`);
            return {
                conversation: updatedConversation,
                message: savedMessage,
                isNewConversation,
            };
        });
        // WebSocket으로 실시간 알림 전송
        if (this.omnichannelGateway) {
            this.omnichannelGateway.emitNewMessage(result.conversation.id, result.message);
            this.omnichannelGateway.emitConversationUpdate(result.conversation);
        }
    }
    async handleStatusUpdate(event) {
        if (!event.status)
            return;
        await this.messageService.updateStatus(event.status.messageId, event.status.status);
        this.logger.log(`Message status updated: ${event.status.messageId} -> ${event.status.status}`);
    }
    async handleConversationCreated(event, channel) {
        const existing = await this.conversationService.findByChannelConversationId(event.channelConversationId);
        if (!existing) {
            await this.conversationService.create({
                channel,
                channelConversationId: event.channelConversationId,
                contactIdentifier: event.contactIdentifier,
                status: 'open',
            });
            this.logger.log(`Created conversation from webhook: ${event.channelConversationId}`);
        }
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(interfaces_1.OMNICHANNEL_MODULE_OPTIONS)),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, typeorm_1.DataSource,
        whatsapp_adapter_1.WhatsAppAdapter,
        instagram_adapter_1.InstagramAdapter, Object, conversation_service_1.ConversationService,
        message_service_1.MessageService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map