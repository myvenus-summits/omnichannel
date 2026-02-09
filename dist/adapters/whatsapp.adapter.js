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
    /**
     * Send message - auto-detects API based on destination format
     * - ConversationSid (CH...) -> Conversations API
     * - Phone number (whatsapp:+...) -> Messaging API
     */
    async sendMessage(to, content) {
        // Detect if this is a Conversations API conversation ID
        if (to.startsWith('CH')) {
            return this.sendMessageViaConversationsApi(to, content);
        }
        // Default to Messaging API
        return this.sendMessageViaMessagingApi(to, content);
    }
    /**
     * Send message via Twilio Messaging API (for Sandbox/direct WhatsApp)
     */
    async sendMessageViaMessagingApi(to, content) {
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
            this.logger.log(`Message sent via Messaging API: ${message.sid}`);
            return {
                success: true,
                channelMessageId: message.sid,
            };
        }
        catch (error) {
            this.logger.error('Failed to send WhatsApp message via Messaging API', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Send message via Twilio Conversations API
     */
    async sendMessageViaConversationsApi(conversationSid, content) {
        try {
            if (!this.client) {
                throw new Error('Twilio client not initialized');
            }
            const messageOptions = {};
            if (content.type === 'text' && content.text) {
                messageOptions.body = content.text;
            }
            // TODO: Handle media for Conversations API (requires media upload first)
            const message = await this.client.conversations.v1
                .conversations(conversationSid)
                .messages.create(messageOptions);
            this.logger.log(`Message sent via Conversations API: ${message.sid}`);
            return {
                success: true,
                channelMessageId: message.sid,
            };
        }
        catch (error) {
            this.logger.error('Failed to send WhatsApp message via Conversations API', error);
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
            // Detect webhook format: Conversations API vs Messaging API
            if (twilioPayload.EventType) {
                // Conversations API format
                return this.parseConversationsApiPayload(twilioPayload);
            }
            else if (twilioPayload.SmsMessageSid || twilioPayload.MessageSid || twilioPayload.From) {
                // Messaging API format (Sandbox)
                return this.parseMessagingApiPayload(twilioPayload);
            }
            this.logger.warn('Unknown Twilio webhook format', { payload });
            return null;
        }
        catch (error) {
            this.logger.error('Failed to parse Twilio webhook payload', error);
            return null;
        }
    }
    /**
     * Parse Twilio Conversations API webhook payload
     */
    parseConversationsApiPayload(twilioPayload) {
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
        if (['onMessageUpdated', 'onDeliveryUpdated'].includes(twilioPayload.EventType ?? '')) {
            return {
                type: 'status_update',
                channelConversationId: twilioPayload.ConversationSid ?? '',
                contactIdentifier: '',
                status: {
                    messageId: twilioPayload.MessageSid ?? '',
                    status: this.mapTwilioStatus(twilioPayload.EventType ?? ''),
                },
            };
        }
        return null;
    }
    /**
     * Parse Twilio Messaging API webhook payload (Sandbox format)
     * https://www.twilio.com/docs/messaging/guides/webhook-request
     */
    parseMessagingApiPayload(twilioPayload) {
        const messageSid = twilioPayload.SmsMessageSid ?? twilioPayload.MessageSid;
        const from = twilioPayload.From ?? '';
        const to = twilioPayload.To ?? '';
        // Check if this is a status callback (has SmsStatus but minimal content)
        if (twilioPayload.SmsStatus && !twilioPayload.Body && !twilioPayload.NumMedia) {
            return {
                type: 'status_update',
                channelConversationId: from, // Use From as conversation identifier
                contactIdentifier: from,
                status: {
                    messageId: messageSid ?? '',
                    status: this.mapMessagingApiStatus(twilioPayload.SmsStatus),
                },
            };
        }
        // This is an incoming message
        // Determine direction: inbound if From is the customer (whatsapp:+xxx), outbound if from our number
        // Fix: Handle case when whatsappNumber is not configured (empty string check)
        const isInbound = from.startsWith('whatsapp:') &&
            (this.whatsappNumber ? !from.includes(this.whatsappNumber) : true);
        const direction = isInbound ? 'inbound' : 'outbound';
        const businessNumber = isInbound ? to : from;
        // Use From as conversation ID (each sender gets their own conversation)
        const conversationId = isInbound ? from : to;
        const contactIdentifier = isInbound ? from : to;
        // Handle media attachments
        const numMedia = parseInt(twilioPayload.NumMedia ?? '0', 10);
        let contentType = 'text';
        let mediaUrl;
        if (numMedia > 0) {
            // Twilio sends MediaUrl0, MediaContentType0, etc. for each attachment
            const rawPayload = twilioPayload;
            const mediaContentType = rawPayload['MediaContentType0'];
            mediaUrl = rawPayload['MediaUrl0'];
            if (mediaContentType) {
                contentType = this.mapMediaType(mediaContentType);
            }
        }
        // Extract contact name from ProfileName (WhatsApp) or use identifier
        const senderName = twilioPayload.ProfileName ?? from;
        this.logger.log(`Parsed Messaging API webhook: ${messageSid} from ${from} (${senderName})`);
        return {
            type: 'message',
            channelConversationId: conversationId,
            contactIdentifier,
            channelAccountId: businessNumber,
            contactName: twilioPayload.ProfileName ?? undefined,
            message: {
                channelMessageId: messageSid ?? '',
                direction,
                senderName,
                contentType,
                contentText: twilioPayload.Body ?? undefined,
                contentMediaUrl: mediaUrl,
                timestamp: new Date(),
                metadata: {
                    accountSid: twilioPayload.AccountSid,
                    waId: twilioPayload.WaId,
                    apiVersion: twilioPayload.ApiVersion,
                    numMedia,
                    numSegments: twilioPayload.NumSegments,
                },
            },
        };
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
    /**
     * Map Messaging API status to internal status
     * https://www.twilio.com/docs/sms/api/message-resource#message-status-values
     */
    mapMessagingApiStatus(smsStatus) {
        switch (smsStatus.toLowerCase()) {
            case 'queued':
            case 'sending':
            case 'sent':
                return 'sent';
            case 'delivered':
                return 'delivered';
            case 'read':
                return 'read';
            case 'failed':
            case 'undelivered':
                return 'failed';
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