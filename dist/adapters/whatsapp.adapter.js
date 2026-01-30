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
var WhatsAppAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppAdapter = void 0;
const common_1 = require("@nestjs/common");
const twilio_1 = require("twilio");
const interfaces_1 = require("../interfaces");
const { AccessToken } = twilio_1.jwt;
const { ChatGrant } = AccessToken;
let WhatsAppAdapter = WhatsAppAdapter_1 = class WhatsAppAdapter {
    options;
    logger = new common_1.Logger(WhatsAppAdapter_1.name);
    client = null;
    conversationsServiceSid;
    whatsappNumber;
    apiKeySid;
    apiKeySecret;
    accountSid;
    channel = 'whatsapp';
    constructor(options) {
        this.options = options;
        const twilio = options?.twilio;
        this.accountSid = twilio?.accountSid ?? '';
        this.conversationsServiceSid = twilio?.conversationsServiceSid ?? '';
        this.whatsappNumber = twilio?.whatsappNumber ?? '';
        this.apiKeySid = twilio?.apiKeySid ?? '';
        this.apiKeySecret = twilio?.apiKeySecret ?? '';
        if (twilio?.accountSid && twilio?.authToken) {
            this.client = new twilio_1.Twilio(twilio.accountSid, twilio.authToken);
        }
        else {
            this.logger.warn('Twilio credentials not configured');
        }
    }
    async sendMessage(to, content) {
        try {
            if (!this.client) {
                throw new Error('Twilio client not initialized');
            }
            const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const fromWhatsapp = `whatsapp:${this.whatsappNumber}`;
            const messageOptions = {
                from: fromWhatsapp,
                to: toWhatsapp,
            };
            if (content.type === 'text' && content.text) {
                messageOptions.body = content.text;
            }
            else if ((content.type === 'image' || content.type === 'file') &&
                content.mediaUrl) {
                messageOptions.mediaUrl = [content.mediaUrl];
                if (content.text) {
                    messageOptions.body = content.text;
                }
            }
            const message = await this.client.messages.create(messageOptions);
            this.logger.log(`Message sent: ${message.sid}`);
            return {
                success: true,
                channelMessageId: message.sid,
            };
        }
        catch (error) {
            this.logger.error('Failed to send WhatsApp message', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async sendTemplateMessage(to, templateId, variables) {
        try {
            if (!this.client) {
                throw new Error('Twilio client not initialized');
            }
            const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const fromWhatsapp = `whatsapp:${this.whatsappNumber}`;
            const message = await this.client.messages.create({
                from: fromWhatsapp,
                to: toWhatsapp,
                contentSid: templateId,
                contentVariables: JSON.stringify(variables),
            });
            this.logger.log(`Template message sent: ${message.sid}`);
            return {
                success: true,
                channelMessageId: message.sid,
            };
        }
        catch (error) {
            this.logger.error('Failed to send WhatsApp template message', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    parseWebhookPayload(payload) {
        try {
            const twilioPayload = payload;
            if (twilioPayload.EventType === 'onMessageAdded') {
                const direction = twilioPayload.Source === 'SDK' ? 'outbound' : 'inbound';
                const contentType = twilioPayload.MediaContentType
                    ? this.mapMediaType(twilioPayload.MediaContentType)
                    : 'text';
                return {
                    type: 'message',
                    channelConversationId: twilioPayload.ConversationSid ?? '',
                    contactIdentifier: twilioPayload.Author ?? '',
                    message: {
                        channelMessageId: twilioPayload.MessageSid ?? '',
                        direction,
                        senderName: twilioPayload.Author ?? '',
                        contentType,
                        contentText: twilioPayload.Body ?? undefined,
                        contentMediaUrl: twilioPayload.MediaUrl ?? undefined,
                        timestamp: twilioPayload.DateCreated
                            ? new Date(twilioPayload.DateCreated)
                            : new Date(),
                        metadata: {
                            participantSid: twilioPayload.ParticipantSid,
                            accountSid: twilioPayload.AccountSid,
                        },
                    },
                };
            }
            if (twilioPayload.EventType === 'onConversationAdded') {
                return {
                    type: 'conversation_created',
                    channelConversationId: twilioPayload.ConversationSid ?? '',
                    contactIdentifier: '',
                };
            }
            if (['onMessageUpdated', 'onDeliveryUpdated'].includes(twilioPayload.EventType)) {
                return {
                    type: 'status_update',
                    channelConversationId: twilioPayload.ConversationSid ?? '',
                    contactIdentifier: '',
                    status: {
                        messageId: twilioPayload.MessageSid ?? '',
                        status: this.mapTwilioStatus(twilioPayload.EventType),
                    },
                };
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to parse Twilio webhook payload', error);
            return null;
        }
    }
    async fetchMessages(conversationId, options) {
        try {
            if (!this.client) {
                throw new Error('Twilio client not initialized');
            }
            const messages = await this.client.conversations.v1
                .conversations(conversationId)
                .messages.list({
                limit: options?.limit ?? 50,
            });
            return messages.map((msg) => ({
                channelMessageId: msg.sid,
                direction: (msg.author?.startsWith('whatsapp:')
                    ? 'inbound'
                    : 'outbound'),
                senderName: msg.author ?? '',
                contentType: 'text',
                contentText: msg.body ?? undefined,
                timestamp: msg.dateCreated,
                metadata: {
                    participantSid: msg.participantSid,
                    index: msg.index,
                },
            }));
        }
        catch (error) {
            this.logger.error('Failed to fetch messages from Twilio', error);
            return [];
        }
    }
    async generateAccessToken(identity) {
        const token = new AccessToken(this.accountSid, this.apiKeySid, this.apiKeySecret, { identity });
        const chatGrant = new ChatGrant({
            serviceSid: this.conversationsServiceSid,
        });
        token.addGrant(chatGrant);
        return token.toJwt();
    }
    mapMediaType(contentType) {
        if (contentType.startsWith('image/'))
            return 'image';
        if (contentType.startsWith('video/'))
            return 'video';
        return 'file';
    }
    mapTwilioStatus(eventType) {
        switch (eventType) {
            case 'onDeliveryUpdated':
                return 'delivered';
            case 'onMessageUpdated':
                return 'read';
            default:
                return 'sent';
        }
    }
};
exports.WhatsAppAdapter = WhatsAppAdapter;
exports.WhatsAppAdapter = WhatsAppAdapter = WhatsAppAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(interfaces_1.OMNICHANNEL_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], WhatsAppAdapter);
//# sourceMappingURL=whatsapp.adapter.js.map