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
const whatsapp_adapter_1 = require("../adapters/whatsapp.adapter");
const instagram_adapter_1 = require("../adapters/instagram.adapter");
const omnichannel_gateway_1 = require("../gateways/omnichannel.gateway");
const conversation_service_1 = require("./conversation.service");
const message_service_1 = require("./message.service");
const interfaces_1 = require("../interfaces");
let WebhookService = WebhookService_1 = class WebhookService {
    options;
    conversationRepository;
    messageRepository;
    whatsappAdapter;
    instagramAdapter;
    omnichannelGateway;
    conversationService;
    messageService;
    logger = new common_1.Logger(WebhookService_1.name);
    appUrl;
    metaWebhookVerifyToken;
    webhookChannelResolver;
    constructor(options, conversationRepository, messageRepository, whatsappAdapter, instagramAdapter, omnichannelGateway, conversationService, messageService) {
        this.options = options;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.whatsappAdapter = whatsappAdapter;
        this.instagramAdapter = instagramAdapter;
        this.omnichannelGateway = omnichannelGateway;
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.appUrl = options?.appUrl ?? '';
        this.metaWebhookVerifyToken = options?.meta?.webhookVerifyToken ?? '';
        this.webhookChannelResolver = options?.webhookChannelResolver ?? null;
        // Gateway 주입 확인 로그
        if (!this.omnichannelGateway) {
            this.logger.error('⚠️ OmnichannelGateway was not injected! Real-time updates will NOT work.');
        }
        else {
            this.logger.log('✅ OmnichannelGateway successfully injected');
        }
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
        // Resolve clinic/channel config from webhook identifier (멀티테넌트)
        let clinicId = null;
        let regionId = null;
        let channelConfigId = null;
        if (this.webhookChannelResolver) {
            try {
                const resolved = await this.webhookChannelResolver(channel, event.contactIdentifier);
                if (resolved) {
                    clinicId = resolved.clinicId;
                    regionId = resolved.regionId ?? null;
                    channelConfigId = resolved.channelConfigId;
                }
            }
            catch (error) {
                this.logger.warn(`Failed to resolve channel config: ${error}`);
            }
        }
        // Find or create conversation
        let conversation = await this.conversationRepository.findByChannelConversationId(event.channelConversationId);
        const isNewConversation = !conversation;
        if (!conversation) {
            conversation = await this.conversationRepository.create({
                channel,
                channelConversationId: event.channelConversationId,
                contactIdentifier: event.contactIdentifier,
                contactName: event.contactName ?? null,
                status: 'open',
                tags: [],
                assignedUserId: null,
                unreadCount: 0,
                lastMessageAt: null,
                lastMessagePreview: null,
                metadata: null,
                clinicId,
                regionId,
                channelConfigId,
            });
            this.logger.log(`Created new conversation: ${conversation.id} (clinic: ${clinicId})`);
        }
        // Check if message already exists
        const existingMessage = await this.messageRepository.findByChannelMessageId(event.message.channelMessageId);
        if (existingMessage) {
            this.logger.log(`Message ${event.message.channelMessageId} already exists`);
            return;
        }
        // Create message
        const message = await this.messageRepository.create({
            conversationId: conversation.id,
            channelMessageId: event.message.channelMessageId,
            direction: event.message.direction,
            senderName: event.message.senderName ?? null,
            senderUserId: null,
            contentType: event.message.contentType,
            contentText: event.message.contentText ?? null,
            contentMediaUrl: event.message.contentMediaUrl ?? null,
            status: event.message.direction === 'inbound' ? 'delivered' : 'sent',
            metadata: event.message.metadata ?? null,
        });
        // Update conversation
        const newUnreadCount = event.message.direction === 'inbound'
            ? (conversation.unreadCount ?? 0) + 1
            : conversation.unreadCount ?? 0;
        const updatedConversation = await this.conversationRepository.update(conversation.id, {
            lastMessageAt: event.message.timestamp,
            lastMessagePreview: event.message.contentText?.substring(0, 100) ?? '[미디어]',
            unreadCount: newUnreadCount,
        });
        this.logger.log(`Message saved: ${event.message.channelMessageId} in conversation ${conversation.id}`);
        // WebSocket으로 실시간 알림 전송
        this.logger.log(`🔔 Emitting WebSocket events for conversation ${updatedConversation.id}`);
        this.omnichannelGateway?.emitNewMessage(updatedConversation.id, message);
        this.omnichannelGateway?.emitConversationUpdate(updatedConversation);
    }
    async handleStatusUpdate(event) {
        if (!event.status)
            return;
        const { messageId, status } = event.status;
        // 메시지 상태 업데이트
        await this.messageService.updateStatus(messageId, status);
        this.logger.log(`Message status updated: ${messageId} -> ${status}`);
        // 메시지 조회해서 conversationId 가져오기
        const message = await this.messageRepository.findByChannelMessageId(messageId);
        if (message && this.omnichannelGateway) {
            // WebSocket으로 상태 변경 브로드캐스트
            this.omnichannelGateway.emitMessageStatusUpdate(message.conversationId, messageId, status);
            this.logger.log(`🔔 Broadcast message status update: ${messageId} -> ${status}`);
        }
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
    __param(1, (0, common_1.Inject)(interfaces_1.CONVERSATION_REPOSITORY)),
    __param(2, (0, common_1.Inject)(interfaces_1.MESSAGE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object, whatsapp_adapter_1.WhatsAppAdapter,
        instagram_adapter_1.InstagramAdapter,
        omnichannel_gateway_1.OmnichannelGateway,
        conversation_service_1.ConversationService,
        message_service_1.MessageService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map