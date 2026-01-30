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
    apiVersion = 'v21.0';
    baseUrl = 'https://graph.instagram.com';
    channel = 'instagram';
    constructor(options) {
        this.options = options;
        const meta = options?.meta;
        this.accessToken = meta?.accessToken ?? '';
        this.appSecret = meta?.appSecret ?? '';
        this.webhookVerifyToken = meta?.webhookVerifyToken ?? '';
        if (!this.accessToken) {
            this.logger.warn('Instagram access token not configured');
        }
    }
    /**
     * Send a message via Instagram Messaging API
     */
    async sendMessage(to, content) {
        try {
            if (!this.accessToken) {
                throw new Error('Instagram access token not configured');
            }
            const messagePayload = this.buildMessagePayload(content);
            const url = `${this.baseUrl}/${this.apiVersion}/me/messages`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({
                    recipient: { id: to },
                    message: messagePayload,
                }),
            });
            const result = (await response.json());
            if (!response.ok || result.error) {
                this.logger.error('Instagram API error', result.error);
                return {
                    success: false,
                    error: result.error?.message ?? 'Unknown Instagram API error',
                };
            }
            this.logger.log(`Message sent to Instagram: ${result.message_id}`);
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
     */
    async sendTemplateMessage(to, templateId, variables) {
        try {
            if (!this.accessToken) {
                throw new Error('Instagram access token not configured');
            }
            // Instagram uses generic templates for structured messages
            const url = `${this.baseUrl}/${this.apiVersion}/me/messages`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.accessToken}`,
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
            this.logger.log(`Template message sent: ${result.message_id}`);
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
     */
    async fetchMessages(conversationId, options) {
        try {
            if (!this.accessToken) {
                throw new Error('Instagram access token not configured');
            }
            const limit = options?.limit ?? 50;
            let url = `${this.baseUrl}/${this.apiVersion}/${conversationId}?fields=messages{id,message,from,to,created_time}&limit=${limit}`;
            if (options?.before) {
                url += `&before=${options.before}`;
            }
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Instagram API error: ${response.status}`);
            }
            const data = (await response.json());
            const messages = [];
            for (const conversation of data.data) {
                if (conversation.messages?.data) {
                    for (const msg of conversation.messages.data) {
                        messages.push({
                            channelMessageId: msg.id,
                            direction: this.determineDirection(msg.from.id, conversationId),
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
     */
    parseMessagingEvent(event, pageId) {
        // Handle message event
        if (event.message && !event.message.is_echo && !event.message.is_deleted) {
            const direction = event.sender.id === pageId ? 'outbound' : 'inbound';
            const contentType = this.determineContentType(event.message);
            const mediaUrl = this.extractMediaUrl(event.message);
            return {
                type: 'message',
                channelConversationId: this.buildConversationId(event.sender.id, event.recipient.id),
                contactIdentifier: direction === 'inbound' ? event.sender.id : event.recipient.id,
                message: {
                    channelMessageId: event.message.mid,
                    direction,
                    senderName: event.sender.id,
                    contentType,
                    contentText: event.message.text,
                    contentMediaUrl: mediaUrl,
                    timestamp: new Date(event.timestamp),
                    metadata: {
                        isQuickReply: !!event.message.quick_reply,
                        quickReplyPayload: event.message.quick_reply?.payload,
                        replyToMid: event.message.reply_to?.mid,
                    },
                },
            };
        }
        // Handle delivery event
        if (event.delivery) {
            return {
                type: 'status_update',
                channelConversationId: this.buildConversationId(event.sender.id, event.recipient.id),
                contactIdentifier: event.sender.id,
                status: {
                    messageId: event.delivery.mids[0] ?? '',
                    status: 'delivered',
                },
            };
        }
        // Handle read event
        if (event.read) {
            return {
                type: 'status_update',
                channelConversationId: this.buildConversationId(event.sender.id, event.recipient.id),
                contactIdentifier: event.sender.id,
                status: {
                    messageId: `read_${event.read.watermark}`,
                    status: 'read',
                },
            };
        }
        // Handle echo message (outbound message sent)
        if (event.message?.is_echo) {
            return {
                type: 'message',
                channelConversationId: this.buildConversationId(event.sender.id, event.recipient.id),
                contactIdentifier: event.recipient.id,
                message: {
                    channelMessageId: event.message.mid,
                    direction: 'outbound',
                    senderName: event.sender.id,
                    contentType: this.determineContentType(event.message),
                    contentText: event.message.text,
                    contentMediaUrl: this.extractMediaUrl(event.message),
                    timestamp: new Date(event.timestamp),
                    metadata: {
                        isEcho: true,
                    },
                },
            };
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
     * Build consistent conversation ID from participant IDs
     */
    buildConversationId(senderId, recipientId) {
        // Sort IDs to ensure consistent conversation ID regardless of direction
        const ids = [senderId, recipientId].sort();
        return `instagram_${ids[0]}_${ids[1]}`;
    }
    /**
     * Determine message direction based on sender
     */
    determineDirection(senderId, _conversationId) {
        // This is a simplified version - in production you'd compare against
        // your business account ID stored in configuration
        // For now, we'll treat it as inbound by default (can be adjusted based on config)
        return 'inbound';
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