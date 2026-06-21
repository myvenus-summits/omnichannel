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
    appUrl;
    channel = 'whatsapp';
    constructor(options) {
        this.options = options;
        const twilio = options?.twilio;
        this.accountSid = twilio?.accountSid ?? '';
        this.conversationsServiceSid = twilio?.conversationsServiceSid ?? '';
        this.whatsappNumber = twilio?.whatsappNumber ?? '';
        this.apiKeySid = twilio?.apiKeySid ?? '';
        this.apiKeySecret = twilio?.apiKeySecret ?? '';
        this.appUrl = options?.appUrl ?? '';
        if (twilio?.accountSid && twilio?.authToken) {
            this.client = new twilio_1.Twilio(twilio.accountSid, twilio.authToken);
        }
        else {
            this.logger.warn('Twilio credentials not configured');
        }
    }
    /**
     * Resolve Twilio client: override credentials가 기본값과 다르면 새 클라이언트 생성
     */
    resolveTwilioClient(credentials) {
        const twilio = credentials?.twilio;
        if (twilio?.accountSid &&
            twilio?.authToken &&
            twilio.accountSid !== this.accountSid) {
            return {
                client: new twilio_1.Twilio(twilio.accountSid, twilio.authToken),
                whatsappNumber: twilio.whatsappNumber ?? this.whatsappNumber,
            };
        }
        return {
            client: this.client,
            whatsappNumber: twilio?.whatsappNumber ?? this.whatsappNumber,
        };
    }
    /**
     * Send message - auto-detects API based on destination format
     * - ConversationSid (CH...) -> Conversations API
     * - Phone number (whatsapp:+...) -> Messaging API
     */
    async sendMessage(to, content, credentials) {
        // Detect if this is a Conversations API conversation ID
        if (to.startsWith('CH')) {
            return this.sendMessageViaConversationsApi(to, content, credentials);
        }
        // Default to Messaging API
        return this.sendMessageViaMessagingApi(to, content, credentials);
    }
    /**
     * Send message via Twilio Messaging API (for Sandbox/direct WhatsApp)
     */
    async sendMessageViaMessagingApi(to, content, credentials) {
        try {
            const { client, whatsappNumber } = this.resolveTwilioClient(credentials);
            if (!client) {
                throw new Error('Twilio client not initialized');
            }
            const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const fromWhatsapp = `whatsapp:${whatsappNumber}`;
            const messageOptions = {
                from: fromWhatsapp,
                to: toWhatsapp,
            };
            if (this.appUrl) {
                messageOptions.statusCallback = `${this.appUrl}/webhooks/twilio/status`;
            }
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
            if (!messageOptions.body && !messageOptions.mediaUrl) {
                return {
                    success: false,
                    error: 'Message must have text body or media URL',
                };
            }
            const message = await client.messages.create(messageOptions);
            this.logger.log(`Message sent via Messaging API: ${message.sid}`);
            return {
                success: true,
                channelMessageId: message.sid,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorCode = error?.code ?? error?.status;
            if (errorCode) {
                this.logger.error(`Twilio error code: ${errorCode}`);
            }
            this.logger.error('Failed to send WhatsApp message via Messaging API', error);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Send message via Twilio Conversations API
     */
    async sendMessageViaConversationsApi(conversationSid, content, credentials) {
        try {
            const { client } = this.resolveTwilioClient(credentials);
            if (!client) {
                throw new Error('Twilio client not initialized');
            }
            const messageOptions = {};
            if (content.type === 'text' && content.text) {
                messageOptions.body = content.text;
            }
            // TODO: Handle media for Conversations API (requires media upload first)
            const message = await client.conversations.v1
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
    async sendTemplateMessage(to, templateId, variables, credentials) {
        try {
            const { client, whatsappNumber } = this.resolveTwilioClient(credentials);
            if (!client) {
                throw new Error('Twilio client not initialized');
            }
            const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const fromWhatsapp = `whatsapp:${whatsappNumber}`;
            const hasVariables = Object.keys(variables).length > 0;
            const message = await client.messages.create({
                from: fromWhatsapp,
                to: toWhatsapp,
                contentSid: templateId,
                ...(hasVariables && { contentVariables: JSON.stringify(variables) }),
                ...(this.appUrl && { statusCallback: `${this.appUrl}/webhooks/twilio/status` }),
            });
            this.logger.log(`Template message sent: ${message.sid}`);
            return {
                success: true,
                channelMessageId: message.sid,
            };
        }
        catch (error) {
            const twilioCode = error?.code;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send WhatsApp template message [contentSid=${templateId}, variables=${JSON.stringify(variables)}, twilioCode=${twilioCode}]`, error);
            return {
                success: false,
                error: twilioCode ? `[${twilioCode}] ${errorMessage}` : errorMessage,
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
     * Guarantee a non-empty, collision-resistant channel message id.
     *
     * Twilio's MessageSid/SmsMessageSid is effectively always present on real
     * webhooks, but when it is missing we must never emit ''. Under the
     * server-side ON CONFLICT upsert (MW-89) two distinct messages sharing the
     * empty-string key would silently merge, and a status update keyed on ''
     * could match the wrong stored row. The fallback is derived from stable
     * payload fields so a retried webhook for the same message yields the same
     * id (correct dedup) rather than a fresh duplicate.
     */
    ensureChannelMessageId(sid, ...fallbackParts) {
        const trimmed = sid?.trim();
        if (trimmed)
            return trimmed;
        const suffix = fallbackParts
            .map((part) => part?.trim())
            .filter((part) => !!part)
            .join('-');
        return `wa-fallback-${suffix || 'unknown'}`;
    }
    /**
     * Parse Twilio Conversations API webhook payload
     */
    parseConversationsApiPayload(twilioPayload) {
        if (twilioPayload.EventType === 'onMessageAdded') {
            // Outbound when the message originated from our side. Source='SDK' covers
            // Console/SDK sends, but REST API sends carry Source='API' — the same
            // value an inbound customer message can have — so Source alone cannot
            // disambiguate a self-echo from a customer message. Fall back to author
            // identity: our own business WhatsApp number => outbound.
            const author = twilioPayload.Author ?? '';
            const direction = twilioPayload.Source === 'SDK' ||
                (this.whatsappNumber !== '' && author.includes(this.whatsappNumber))
                ? 'outbound'
                : 'inbound';
            const contentType = twilioPayload.MediaContentType
                ? this.mapMediaType(twilioPayload.MediaContentType)
                : 'text';
            return {
                type: 'message',
                channelConversationId: twilioPayload.ConversationSid ?? '',
                contactIdentifier: twilioPayload.Author ?? '',
                message: {
                    channelMessageId: this.ensureChannelMessageId(twilioPayload.MessageSid, twilioPayload.ConversationSid, twilioPayload.ParticipantSid, twilioPayload.DateCreated),
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
                    messageId: this.ensureChannelMessageId(twilioPayload.MessageSid, twilioPayload.ConversationSid),
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
                    messageId: this.ensureChannelMessageId(messageSid, from, to),
                    status: this.mapMessagingApiStatus(twilioPayload.SmsStatus),
                    errorCode: twilioPayload.ErrorCode ? parseInt(twilioPayload.ErrorCode, 10) : undefined,
                    errorMessage: twilioPayload.ErrorMessage ?? undefined,
                },
            };
        }
        // Check if this is a reaction (ButtonPayload with emoji, no Body)
        const buttonPayload = twilioPayload.ButtonPayload;
        const originalMessageSid = twilioPayload.OriginalRepliedMessageSid;
        if (buttonPayload && !twilioPayload.Body && originalMessageSid) {
            const conversationId = from;
            return {
                type: 'reaction',
                channelConversationId: conversationId,
                contactIdentifier: from,
                channelAccountId: to,
                reaction: {
                    targetMessageId: originalMessageSid,
                    emoji: buttonPayload,
                    action: 'react',
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
            const mediaContentType = twilioPayload.MediaContentType0;
            mediaUrl = twilioPayload.MediaUrl0;
            if (mediaContentType) {
                contentType = this.mapMediaType(mediaContentType);
            }
        }
        // Extract contact name from ProfileName (WhatsApp) or use identifier
        const senderName = twilioPayload.ProfileName ?? from;
        this.logger.log(`Parsed Messaging API webhook: ${messageSid} from ${from} (${senderName})`);
        // Extract reply context from Twilio webhook (OriginalRepliedMessageSid)
        const replyToExternalId = twilioPayload.OriginalRepliedMessageSid ?? undefined;
        // Click-to-WhatsApp (CTWA) ad referral — present only when this conversation
        // started from a Meta "Click to WhatsApp" ad; undefined for organic messages.
        const referral = this.parseReferral(twilioPayload);
        return {
            type: 'message',
            channelConversationId: conversationId,
            contactIdentifier,
            channelAccountId: businessNumber,
            contactName: twilioPayload.ProfileName ?? undefined,
            message: {
                channelMessageId: this.ensureChannelMessageId(messageSid, from, to, twilioPayload.WaId),
                direction,
                senderName,
                contentType,
                contentText: twilioPayload.Body ?? undefined,
                contentMediaUrl: mediaUrl,
                replyToExternalId,
                timestamp: new Date(),
                metadata: {
                    accountSid: twilioPayload.AccountSid,
                    waId: twilioPayload.WaId,
                    apiVersion: twilioPayload.ApiVersion,
                    numMedia,
                    numSegments: twilioPayload.NumSegments,
                    ...(referral ? { referral } : {}),
                },
            },
        };
    }
    /**
     * Extract Click-to-WhatsApp (CTWA) ad referral attributes from a Twilio
     * Messaging API webhook.
     *
     * Twilio sends these fields ONLY when the inbound message originated from a
     * Meta "Click to WhatsApp" ad (Instagram / Facebook). For organic messages
     * none are present, so this returns `undefined` and the message metadata is
     * left byte-for-byte unchanged — keeping behaviour identical for non-ad
     * traffic across every service that consumes this package.
     *
     * https://www.twilio.com/docs/messaging/guides/webhook-request
     */
    parseReferral(twilioPayload) {
        const entries = [
            ['ctwaClid', twilioPayload.ReferralCtwaClid],
            ['sourceId', twilioPayload.ReferralSourceId],
            ['sourceType', twilioPayload.ReferralSourceType],
            ['sourceUrl', twilioPayload.ReferralSourceUrl],
            ['headline', twilioPayload.ReferralHeadline],
            ['body', twilioPayload.ReferralBody],
            ['mediaId', twilioPayload.ReferralMediaId],
            ['mediaContentType', twilioPayload.ReferralMediaContentType],
            ['mediaUrl', twilioPayload.ReferralMediaUrl],
            ['numMedia', twilioPayload.ReferralNumMedia],
        ];
        const referral = {};
        for (const [key, value] of entries) {
            if (value !== undefined && value !== null && value !== '') {
                referral[key] = value;
            }
        }
        return Object.keys(referral).length > 0 ? referral : undefined;
    }
    async fetchMessages(conversationId, options, credentials) {
        // Normalize: plain E164 ('+8210...') → 'whatsapp:+8210...'
        const normalizedId = conversationId.startsWith('+')
            ? `whatsapp:${conversationId}`
            : conversationId;
        // Messaging API: 'whatsapp:+'로 시작하면 Messaging API 사용
        if (normalizedId.startsWith('whatsapp:+')) {
            return this.fetchMessagesViaMessagingApi(normalizedId, options, credentials);
        }
        // Conversations API: 'CH'로 시작 (기존 방식)
        try {
            const { client } = this.resolveTwilioClient(credentials);
            if (!client) {
                throw new Error('Twilio client not initialized');
            }
            const messages = await client.conversations.v1
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
    /**
     * Messaging API를 통한 메시지 조회 (WhatsApp Sandbox / Business API)
     * inbound + outbound 양방향 메시지를 조회해서 시간순으로 정렬
     */
    async fetchMessagesViaMessagingApi(customerNumber, options, credentials) {
        try {
            const { client, whatsappNumber } = this.resolveTwilioClient(credentials);
            if (!client) {
                throw new Error('Twilio client not initialized');
            }
            const businessNumber = `whatsapp:+${whatsappNumber.replace(/^\+/, '')}`;
            const limit = options?.limit ?? 100;
            // 양방향 메시지 동시 조회
            const [inboundMessages, outboundMessages] = await Promise.all([
                client.messages.list({ from: customerNumber, to: businessNumber, limit }),
                client.messages.list({ from: businessNumber, to: customerNumber, limit }),
            ]);
            // 두 결과 merge 후 시간순 정렬
            const allMessages = [...inboundMessages, ...outboundMessages].sort((a, b) => new Date(a.dateSent ?? a.dateCreated).getTime() - new Date(b.dateSent ?? b.dateCreated).getTime());
            const normalized = [];
            for (const msg of allMessages) {
                const direction = msg.from === customerNumber ? 'inbound' : 'outbound';
                let contentType = 'text';
                let mediaUrl;
                // 미디어 첨부파일 조회
                const numMedia = parseInt(msg.numMedia ?? '0', 10);
                if (numMedia > 0) {
                    try {
                        const mediaList = await client.messages(msg.sid).media.list({ limit: 1 });
                        if (mediaList.length > 0) {
                            const media = mediaList[0];
                            mediaUrl = `https://api.twilio.com/2010-04-01/Accounts/${media.accountSid}/Messages/${msg.sid}/Media/${media.sid}`;
                            contentType = this.mapMediaType(media.contentType);
                        }
                    }
                    catch (mediaError) {
                        this.logger.warn(`Failed to fetch media for message ${msg.sid}`, mediaError);
                    }
                }
                normalized.push({
                    channelMessageId: msg.sid,
                    direction,
                    senderName: direction === 'inbound' ? customerNumber : businessNumber,
                    contentType,
                    contentText: msg.body ?? undefined,
                    contentMediaUrl: mediaUrl,
                    timestamp: new Date(msg.dateSent ?? msg.dateCreated),
                    metadata: {
                        accountSid: msg.accountSid,
                        numMedia,
                        status: msg.status,
                    },
                });
            }
            this.logger.log(`Fetched ${normalized.length} messages via Messaging API for ${customerNumber}`);
            return normalized;
        }
        catch (error) {
            this.logger.error('Failed to fetch messages via Messaging API', error);
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