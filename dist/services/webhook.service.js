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
    contactChannelRepository;
    whatsappAdapter;
    instagramAdapter;
    omnichannelGateway;
    conversationService;
    messageService;
    logger = new common_1.Logger(WebhookService_1.name);
    appUrl;
    metaWebhookVerifyToken;
    webhookChannelResolver;
    constructor(options, conversationRepository, messageRepository, contactChannelRepository, whatsappAdapter, instagramAdapter, omnichannelGateway, conversationService, messageService) {
        this.options = options;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.contactChannelRepository = contactChannelRepository;
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
        // 메시지 중복 체크를 conversation 생성 전에 수행 (불필요한 conversation 생성 방지)
        const existingMessage = await this.messageRepository.findByChannelMessageId(event.message.channelMessageId);
        if (existingMessage) {
            this.logger.log(`Message ${event.message.channelMessageId} already exists, skipping`);
            return;
        }
        // Resolve clinic/channel config from webhook identifier (멀티테넌트)
        let clinicId = null;
        let regionId = null;
        let channelConfigId = null;
        if (this.webhookChannelResolver) {
            try {
                const resolverIdentifier = event.channelAccountId || event.contactIdentifier;
                const resolved = await this.webhookChannelResolver(channel, resolverIdentifier);
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
        // Resolve per-clinic credentials for API calls (e.g., fetchUserProfile)
        let resolvedCredentials;
        if (this.options?.channelCredentialsResolver && channelConfigId) {
            try {
                resolvedCredentials = await this.options.channelCredentialsResolver(channelConfigId);
            }
            catch (error) {
                this.logger.warn(`Failed to resolve credentials for channelConfigId ${channelConfigId}: ${error}`);
            }
        }
        // Use existing contactName; for Instagram, resolve username asynchronously after message is saved
        let contactName = event.contactName ?? null;
        // If no contactName from event, use previously resolved name from existing conversation
        if (!contactName && conversation?.contactName) {
            contactName = conversation.contactName;
        }
        if (!conversation) {
            conversation = await this.conversationRepository.create({
                channel,
                channelConversationId: event.channelConversationId,
                contactIdentifier: event.contactIdentifier,
                contactName,
                status: 'open',
                tags: [],
                assignedUserId: null,
                unreadCount: 0,
                lastMessageAt: null,
                lastMessagePreview: null,
                lastInboundAt: event.message.direction === 'inbound' ? event.message.timestamp : null,
                metadata: null,
                clinicId,
                regionId,
                channelConfigId,
            });
            this.logger.log(`Created new conversation: ${conversation.id} (clinic: ${clinicId})`);
        }
        else if (conversation && !conversation.channelConfigId && channelConfigId) {
            // Backfill channelConfigId for conversations created before config resolution was available
            await this.conversationRepository.update(conversation.id, {
                channelConfigId,
                clinicId: clinicId ?? conversation.clinicId,
                regionId: regionId ?? conversation.regionId,
            });
            conversation.channelConfigId = channelConfigId;
            this.logger.log(`Backfilled channelConfigId=${channelConfigId} for conversation ${conversation.id}`);
        }
        if (channel === 'instagram' && contactName && !conversation.contactName) {
            // Update existing conversation with resolved username
            await this.conversationRepository.update(conversation.id, { contactName });
            conversation.contactName = contactName;
            this.logger.log(`Updated conversation ${conversation.id} with Instagram username: ${contactName}`);
        }
        // Create message (use resolved contactName for inbound messages)
        const senderName = event.message.direction === 'inbound' && contactName
            ? contactName
            : event.message.senderName ?? null;
        // Resolve reply-to context
        let replyToMessageId = null;
        let replyToPreview = null;
        if (event.message.replyToExternalId) {
            const replyTarget = await this.messageRepository.findByChannelMessageId(event.message.replyToExternalId);
            if (replyTarget) {
                replyToMessageId = replyTarget.id;
                replyToPreview = (replyTarget.contentText ?? '').substring(0, 100) || null;
            }
        }
        const message = await this.messageRepository.create({
            conversationId: conversation.id,
            channelMessageId: event.message.channelMessageId,
            direction: event.message.direction,
            senderName,
            senderUserId: null,
            contentType: event.message.contentType,
            contentText: event.message.contentText ?? null,
            contentMediaUrl: event.message.contentMediaUrl ?? null,
            replyToMessageId,
            replyToPreview,
            status: event.message.direction === 'inbound' ? 'delivered' : 'sent',
            metadata: event.message.metadata ?? null,
        });
        // Update conversation
        const newUnreadCount = event.message.direction === 'inbound'
            ? (conversation.unreadCount ?? 0) + 1
            : conversation.unreadCount ?? 0;
        const updateData = {
            lastMessageAt: event.message.timestamp,
            lastMessagePreview: event.message.contentText?.substring(0, 100) ?? '[미디어]',
            unreadCount: newUnreadCount,
        };
        if (event.message.direction === 'inbound') {
            updateData.lastInboundAt = event.message.timestamp;
        }
        const updatedConversation = await this.conversationRepository.update(conversation.id, updateData);
        this.logger.log(`Message saved: ${event.message.channelMessageId} in conversation ${conversation.id}`);
        // WebSocket으로 실시간 알림 전송
        this.logger.log(`🔔 Emitting WebSocket events for conversation ${updatedConversation.id}`);
        this.omnichannelGateway?.emitNewMessage(updatedConversation.id, message);
        this.omnichannelGateway?.emitConversationUpdate(updatedConversation);
        // Instagram: resolve username asynchronously (non-blocking)
        if (channel === 'instagram' && event.contactIdentifier) {
            const needsUsernameResolution = !updatedConversation.contactName || /^\d+$/.test(updatedConversation.contactName);
            if (needsUsernameResolution) {
                this.resolveInstagramUsername(updatedConversation.id, event.contactIdentifier, resolvedCredentials);
            }
        }
    }
    /**
     * Instagram 사용자 이름 비동기 해결 (fire-and-forget)
     */
    resolveInstagramUsername(conversationId, contactIdentifier, credentials) {
        (async () => {
            try {
                this.logger.log(`[Background] Resolving Instagram username for: ${contactIdentifier}`);
                const profile = await this.instagramAdapter.fetchUserProfile(contactIdentifier, credentials);
                if (!profile) {
                    this.logger.warn(`[Background] Could not resolve Instagram username for ${contactIdentifier}`);
                    return;
                }
                const displayName = profile.username
                    ? `@${profile.username}`
                    : profile.name || null;
                if (!displayName) {
                    this.logger.warn(`[Background] Could not resolve Instagram display name for ${contactIdentifier}`);
                    return;
                }
                const resolvedName = displayName;
                this.logger.log(`[Background] Resolved Instagram username: ${resolvedName}`);
                // Update conversation with resolved name
                const updatedConversation = await this.conversationRepository.update(conversationId, {
                    contactName: resolvedName,
                });
                // Emit a second conversation:update with the resolved name
                if (this.omnichannelGateway) {
                    this.omnichannelGateway.emitConversationUpdate(updatedConversation);
                }
                // Save profile to contact_channel
                if (this.contactChannelRepository) {
                    try {
                        const existing = await this.contactChannelRepository.findByChannelIdentifier('instagram', contactIdentifier);
                        if (existing) {
                            await this.contactChannelRepository.update(existing.id, {
                                channelDisplayName: resolvedName,
                                channelProfileUrl: profile.profile_picture_url ?? existing.channelProfileUrl,
                            });
                        }
                        else {
                            await this.contactChannelRepository.create({
                                channel: 'instagram',
                                channelIdentifier: contactIdentifier,
                                channelDisplayName: resolvedName,
                                channelProfileUrl: profile.profile_picture_url ?? null,
                                contactId: null,
                                metadata: null,
                                lastContactedAt: new Date(),
                            });
                        }
                    }
                    catch (error) {
                        this.logger.warn(`[Background] Failed to save Instagram profile for ${contactIdentifier}: ${error}`);
                    }
                }
            }
            catch (error) {
                this.logger.warn(`[Background] Failed to resolve Instagram username for ${contactIdentifier}: ${error}`);
            }
        })();
    }
    async handleStatusUpdate(event) {
        if (!event.status)
            return;
        const { messageId, status, watermark, errorCode, errorMessage } = event.status;
        // Watermark-based bulk update (Instagram read receipts)
        if (watermark && this.messageRepository.findOutboundBeforeTimestamp) {
            const conversation = await this.conversationRepository.findByChannelConversationId(event.channelConversationId);
            if (!conversation) {
                this.logger.warn(`Watermark update: conversation not found for ${event.channelConversationId}`);
                return;
            }
            const messages = await this.messageRepository.findOutboundBeforeTimestamp(conversation.id, new Date(watermark));
            const toUpdate = messages.filter(m => m.status !== status);
            for (const msg of toUpdate) {
                await this.messageRepository.updateStatus(msg.channelMessageId, status);
                if (this.omnichannelGateway) {
                    this.omnichannelGateway.emitMessageStatusUpdate(conversation.id, msg.channelMessageId, status);
                }
            }
            this.logger.log(`Watermark read update: ${toUpdate.length} messages in conversation ${conversation.id}`);
            return;
        }
        // Standard single-message update (WhatsApp, Instagram delivery)
        if (!messageId)
            return;
        const errorMetadata = (errorCode || errorMessage)
            ? { errorCode, errorMessage }
            : undefined;
        await this.messageService.updateStatus(messageId, status, errorMetadata);
        this.logger.log(`Message status updated: ${messageId} -> ${status}${errorMetadata ? ` (error: ${errorCode} - ${errorMessage})` : ''}`);
        const message = await this.messageRepository.findByChannelMessageId(messageId);
        if (message && this.omnichannelGateway) {
            this.omnichannelGateway.emitMessageStatusUpdate(message.conversationId, messageId, status, errorMetadata);
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
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)(interfaces_1.CONTACT_CHANNEL_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, whatsapp_adapter_1.WhatsAppAdapter,
        instagram_adapter_1.InstagramAdapter,
        omnichannel_gateway_1.OmnichannelGateway,
        conversation_service_1.ConversationService,
        message_service_1.MessageService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map