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
var InstagramAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramAdapter = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("../interfaces");
let InstagramAdapter = InstagramAdapter_1 = class InstagramAdapter {
    options;
    logger = new common_1.Logger(InstagramAdapter_1.name);
    accessToken;
    appSecret;
    webhookVerifyToken;
    pageId;
    instagramBusinessAccountId;
    apiVersion = 'v24.0';
    igBaseUrl = 'https://graph.instagram.com';
    channel = 'instagram';
    constructor(options) {
        this.options = options;
        const meta = options?.meta;
        this.accessToken = meta?.accessToken ?? '';
        this.appSecret = meta?.appSecret ?? '';
        this.webhookVerifyToken = meta?.webhookVerifyToken ?? '';
        this.pageId = meta?.pageId ?? '';
        this.instagramBusinessAccountId = meta?.instagramBusinessAccountId ?? '';
        if (!this.accessToken) {
            this.logger.warn('Instagram access token not configured');
        }
        if (!this.pageId) {
            this.logger.warn('Instagram page ID not configured');
        }
        if (!this.instagramBusinessAccountId) {
            this.logger.warn('Instagram Business Account ID not configured - direction detection may be inaccurate');
        }
    }
    /**
     * Resolve credentials: override가 있으면 override 사용, 없으면 기본값 사용
     */
    resolveCredentials(credentials) {
        const meta = credentials?.meta;
        return {
            accessToken: meta?.accessToken || this.accessToken,
            pageId: meta?.pageId || this.pageId,
            instagramBusinessAccountId: meta?.instagramBusinessAccountId || this.instagramBusinessAccountId,
        };
    }
    /**
     * Send a message via Instagram Messaging API (using Facebook Graph API)
     * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
     */
    async sendMessage(to, content, credentials) {
        try {
            const resolved = this.resolveCredentials(credentials);
            if (!resolved.accessToken) {
                throw new Error('Instagram access token not configured');
            }
            const endpointId = resolved.instagramBusinessAccountId || resolved.pageId;
            if (!endpointId) {
                throw new Error('Instagram page ID or account ID not configured');
            }
            const messagePayload = this.buildMessagePayload(content);
            // Instagram Messaging uses the Instagram Graph API endpoint
            const url = `${this.igBaseUrl}/${this.apiVersion}/${endpointId}/messages`;
            const requestBody = {
                recipient: { id: to },
                message: messagePayload,
            };
            if (content.replyToExternalId) {
                requestBody.reply_to = { mid: content.replyToExternalId };
            }
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${resolved.accessToken}`,
                },
                body: JSON.stringify(requestBody),
            });
            const result = (await response.json());
            if (!response.ok || result.error) {
                this.logger.error('Instagram API error', result.error);
                return {
                    success: false,
                    error: result.error?.message ?? 'Unknown Instagram API error',
                };
            }
            this.logger.log(`Message sent to Instagram user ${to} via ${endpointId}: ${result.message_id}`);
            return {
                success: true,
                channelMessageId: result.message_id,
            };
        }
        catch (error) {
            this.logger.error('Failed to send Instagram message', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Send a template message (Instagram generic template)
     * Note: Instagram has limited template support compared to Messenger
     */
    async sendTemplateMessage(to, templateId, variables, credentials) {
        try {
            const resolved = this.resolveCredentials(credentials);
            if (!resolved.accessToken) {
                throw new Error('Instagram access token not configured');
            }
            const endpointId = resolved.instagramBusinessAccountId || resolved.pageId;
            if (!endpointId) {
                throw new Error('Instagram page ID or account ID not configured');
            }
            // Instagram uses generic templates for structured messages
            const url = `${this.igBaseUrl}/${this.apiVersion}/${endpointId}/messages`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${resolved.accessToken}`,
                },
                body: JSON.stringify({
                    recipient: { id: to },
                    message: {
                        attachment: {
                            type: 'template',
                            payload: {
                                template_type: 'generic',
                                elements: [
                                    {
                                        title: variables['title'] ?? templateId,
                                        subtitle: variables['subtitle'] ?? '',
                                        image_url: variables['image_url'],
                                        buttons: variables['buttons']
                                            ? JSON.parse(variables['buttons'])
                                            : undefined,
                                    },
                                ],
                            },
                        },
                    },
                }),
            });
            const result = (await response.json());
            if (!response.ok || result.error) {
                this.logger.error('Instagram template API error', result.error);
                return {
                    success: false,
                    error: result.error?.message ?? 'Unknown Instagram API error',
                };
            }
            this.logger.log(`Template message sent to ${to}: ${result.message_id}`);
            return {
                success: true,
                channelMessageId: result.message_id,
            };
        }
        catch (error) {
            this.logger.error('Failed to send Instagram template message', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Parse Instagram webhook payload into normalized event
     */
    parseWebhookPayload(payload) {
        try {
            const instagramPayload = payload;
            if (instagramPayload.object !== 'instagram') {
                return null;
            }
            for (const entry of instagramPayload.entry) {
                if (!entry.messaging || entry.messaging.length === 0) {
                    continue;
                }
                for (const event of entry.messaging) {
                    const parsed = this.parseMessagingEvent(event, entry.id);
                    if (parsed) {
                        return parsed;
                    }
                }
            }
            return null;
        }
        catch (error) {
            this.logger.error('Failed to parse Instagram webhook payload', error);
            return null;
        }
    }
    /**
     * Fetch messages from Instagram conversation
     * Uses Facebook Graph API for Instagram messaging
     */
    async fetchMessages(conversationId, options) {
        try {
            if (!this.accessToken) {
                throw new Error('Instagram access token not configured');
            }
            const limit = options?.limit ?? 50;
            let url = `${this.igBaseUrl}/${this.apiVersion}/${conversationId}?fields=messages{id,message,from,to,created_time}&limit=${limit}`;
            if (options?.before) {
                url += `&before=${options.before}`;
            }
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Instagram API error: ${response.status} - ${errorText}`);
                throw new Error(`Instagram API error: ${response.status}`);
            }
            const data = (await response.json());
            const messages = [];
            for (const conversation of data.data) {
                if (conversation.messages?.data) {
                    for (const msg of conversation.messages.data) {
                        messages.push({
                            channelMessageId: msg.id,
                            direction: this.determineDirectionById(msg.from.id),
                            senderName: msg.from.username ?? msg.from.id,
                            contentType: 'text',
                            contentText: msg.message,
                            timestamp: new Date(msg.created_time),
                            metadata: {
                                fromId: msg.from.id,
                                toIds: msg.to.data.map((t) => t.id),
                            },
                        });
                    }
                }
            }
            return messages;
        }
        catch (error) {
            this.logger.error('Failed to fetch Instagram messages', error);
            return [];
        }
    }
    /**
     * Verify webhook subscription
     */
    verifyWebhook(token) {
        return token === this.webhookVerifyToken;
    }
    /**
     * Fetch Instagram user profile (username, name)
     * 1차: 직접 IGSID 프로필 조회 (graph.instagram.com)
     * 2차: Conversations API 참가자 정보 조회 (fallback)
     */
    async fetchUserProfile(userId, credentials) {
        const accessToken = credentials?.meta?.accessToken || this.accessToken;
        const igAccountId = credentials?.meta?.instagramBusinessAccountId || this.instagramBusinessAccountId;
        if (!accessToken) {
            this.logger.warn('Instagram access token not configured');
            return null;
        }
        // 1차: 직접 IGSID 프로필 조회
        const profile = await this.directProfileLookup(userId, accessToken);
        if (profile)
            return profile;
        // 2차: Conversations API로 참가자 정보 조회
        if (igAccountId) {
            const convProfile = await this.conversationParticipantLookup(igAccountId, userId, accessToken);
            if (convProfile)
                return convProfile;
        }
        this.logger.warn(`Could not fetch profile for ${userId} via any method`);
        return null;
    }
    /**
     * 직접 IGSID 프로필 조회 (graph.instagram.com)
     */
    async directProfileLookup(userId, accessToken) {
        try {
            const url = `${this.igBaseUrl}/${this.apiVersion}/${userId}?fields=name,username,profile_pic`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                const errorBody = await response.text();
                this.logger.warn(`Direct profile lookup failed for ${userId} (HTTP ${response.status}), trying conversations API. Body: ${errorBody}`);
                return null;
            }
            const data = (await response.json());
            this.logger.log(`Fetched Instagram profile for ${data.id}: @${data.username ?? data.name ?? userId}`);
            return {
                id: data.id,
                username: data.username,
                name: data.name,
                profile_picture_url: data.profile_pic,
            };
        }
        catch (error) {
            this.logger.error(`Direct profile lookup error for ${userId}`, error);
            return null;
        }
    }
    /**
     * Conversations API를 통한 참가자 프로필 조회 (fallback)
     * 직접 IGSID 조회 실패 시, 메시징 컨텍스트 내 참가자 정보로 프로필을 가져옴
     */
    async conversationParticipantLookup(igAccountId, userId, accessToken) {
        try {
            const url = `${this.igBaseUrl}/${this.apiVersion}/${igAccountId}/conversations` +
                `?user_id=${userId}&fields=participants`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) {
                const errorBody = await response.text();
                this.logger.warn(`Conversation participant lookup failed for ${userId} (HTTP ${response.status}): ${errorBody}`);
                return null;
            }
            const result = (await response.json());
            // 대화 참가자 중 해당 userId와 일치하는 참가자 찾기
            for (const conversation of result.data) {
                const participant = conversation.participants?.data?.find((p) => p.id === userId);
                if (participant) {
                    this.logger.log(`Fetched Instagram profile via conversations API for ${userId}: @${participant.username ?? participant.name ?? userId}`);
                    return {
                        id: participant.id,
                        username: participant.username,
                        name: participant.name,
                        profile_picture_url: participant.profile_pic,
                    };
                }
            }
            this.logger.warn(`Conversation participant lookup: no matching participant found for ${userId}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Conversation participant lookup error for ${userId}`, error);
            return null;
        }
    }
    /**
     * Build message payload based on content type
     */
    buildMessagePayload(content) {
        switch (content.type) {
            case 'text':
                return { text: content.text };
            case 'image':
                return {
                    attachment: {
                        type: 'image',
                        payload: {
                            url: content.mediaUrl,
                            is_reusable: true,
                        },
                    },
                };
            case 'file':
                return {
                    attachment: {
                        type: 'file',
                        payload: {
                            url: content.mediaUrl,
                            is_reusable: true,
                        },
                    },
                };
            default:
                return { text: content.text ?? '' };
        }
    }
    /**
     * Parse individual messaging event
     * @param event - The messaging event from webhook
     * @param entryId - The entry ID (Instagram Business Account ID from webhook)
     */
    parseMessagingEvent(event, entryId) {
        // Handle message event
        if (event.message && !event.message.is_echo && !event.message.is_deleted) {
            // Use configured business account ID if available, otherwise fall back to entry ID
            const businessAccountId = this.instagramBusinessAccountId || entryId;
            const direction = event.sender.id === businessAccountId ? 'outbound' : 'inbound';
            const contentType = this.determineContentType(event.message);
            const mediaUrl = this.extractMediaUrl(event.message);
            const contactIdentifier = direction === 'inbound' ? event.sender.id : event.recipient.id;
            return {
                type: 'message',
                channelConversationId: this.buildConversationId(contactIdentifier),
                contactIdentifier,
                channelAccountId: entryId,
                message: {
                    channelMessageId: event.message.mid,
                    direction,
                    senderName: event.sender.id,
                    contentType,
                    contentText: event.message.text,
                    contentMediaUrl: mediaUrl,
                    replyToExternalId: event.message.reply_to?.mid,
                    timestamp: new Date(event.timestamp),
                    metadata: {
                        isQuickReply: !!event.message.quick_reply,
                        quickReplyPayload: event.message.quick_reply?.payload,
                        instagramEntryId: entryId,
                    },
                },
            };
        }
        // Handle delivery event
        if (event.delivery) {
            return {
                type: 'status_update',
                channelConversationId: this.buildConversationId(event.sender.id),
                contactIdentifier: event.sender.id,
                channelAccountId: entryId,
                status: {
                    messageId: event.delivery.mids[0] ?? '',
                    status: 'delivered',
                },
            };
        }
        // Handle read event (watermark-based: all messages up to watermark timestamp are read)
        if (event.read) {
            return {
                type: 'status_update',
                channelConversationId: this.buildConversationId(event.sender.id),
                contactIdentifier: event.sender.id,
                channelAccountId: entryId,
                status: {
                    messageId: '',
                    status: 'read',
                    watermark: event.read.watermark,
                },
            };
        }
        // Skip echo messages — outbound messages are tracked when sent via API.
        // Echo webhooks can create incorrect conversations with business account ID as contact.
        if (event.message?.is_echo) {
            return null;
        }
        return null;
    }
    /**
     * Determine content type from message
     */
    determineContentType(message) {
        if (!message?.attachments || message.attachments.length === 0) {
            return 'text';
        }
        const attachmentType = message.attachments[0].type;
        switch (attachmentType) {
            case 'image':
                return 'image';
            case 'video':
                return 'video';
            default:
                return 'file';
        }
    }
    /**
     * Extract media URL from message attachments
     */
    extractMediaUrl(message) {
        if (!message?.attachments || message.attachments.length === 0) {
            return undefined;
        }
        return message.attachments[0].payload?.url;
    }
    /**
     * Build conversation ID from contact (customer) identifier
     */
    buildConversationId(contactIdentifier) {
        return `instagram:${contactIdentifier}`;
    }
    /**
     * Determine message direction based on sender ID
     * Compares against configured Instagram Business Account ID
     */
    determineDirectionById(senderId) {
        // If no business account ID configured, default to inbound for safety
        if (!this.instagramBusinessAccountId) {
            return 'inbound';
        }
        // If sender is our business account, it's an outbound message
        return senderId === this.instagramBusinessAccountId ? 'outbound' : 'inbound';
    }
};
exports.InstagramAdapter = InstagramAdapter;
exports.InstagramAdapter = InstagramAdapter = InstagramAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(interfaces_1.OMNICHANNEL_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], InstagramAdapter);
//# sourceMappingURL=instagram.adapter.js.map