import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import type { ChannelAdapter } from './channel.adapter.interface';
import type {
  MessageContent,
  SendMessageResult,
  NormalizedWebhookEvent,
  NormalizedMessage,
  ChannelType,
  MessageDirection,
  MessageContentType,
  MessageStatus,
} from '../types';
import type {
  InstagramWebhookDto,
  InstagramMessagingEvent,
} from '../dto/instagram-webhook.dto';
import {
  OMNICHANNEL_MODULE_OPTIONS,
  type OmnichannelModuleOptions,
} from '../interfaces';

interface InstagramApiResponse {
  recipient_id?: string;
  message_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

interface InstagramConversationResponse {
  data: Array<{
    id: string;
    messages?: {
      data: Array<{
        id: string;
        message: string;
        from: { id: string; username?: string };
        to: { data: Array<{ id: string; username?: string }> };
        created_time: string;
      }>;
    };
  }>;
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

@Injectable()
export class InstagramAdapter implements ChannelAdapter {
  private readonly logger = new Logger(InstagramAdapter.name);
  private readonly accessToken: string;
  private readonly appSecret: string;
  private readonly webhookVerifyToken: string;
  private readonly apiVersion = 'v21.0';
  private readonly baseUrl = 'https://graph.instagram.com';

  readonly channel: ChannelType = 'instagram';

  constructor(
    @Optional()
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly options?: OmnichannelModuleOptions,
  ) {
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
  async sendMessage(
    to: string,
    content: MessageContent,
  ): Promise<SendMessageResult> {
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

      const result = (await response.json()) as InstagramApiResponse;

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
    } catch (error) {
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
  async sendTemplateMessage(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<SendMessageResult> {
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

      const result = (await response.json()) as InstagramApiResponse;

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
    } catch (error) {
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
  parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null {
    try {
      const instagramPayload = payload as InstagramWebhookDto;

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
    } catch (error) {
      this.logger.error('Failed to parse Instagram webhook payload', error);
      return null;
    }
  }

  /**
   * Fetch messages from Instagram conversation
   */
  async fetchMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<NormalizedMessage[]> {
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

      const data = (await response.json()) as InstagramConversationResponse;
      const messages: NormalizedMessage[] = [];

      for (const conversation of data.data) {
        if (conversation.messages?.data) {
          for (const msg of conversation.messages.data) {
            messages.push({
              channelMessageId: msg.id,
              direction: this.determineDirection(
                msg.from.id,
                conversationId,
              ),
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
    } catch (error) {
      this.logger.error('Failed to fetch Instagram messages', error);
      return [];
    }
  }

  /**
   * Verify webhook subscription
   */
  verifyWebhook(token: string): boolean {
    return token === this.webhookVerifyToken;
  }

  /**
   * Build message payload based on content type
   */
  private buildMessagePayload(content: MessageContent): Record<string, unknown> {
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
  private parseMessagingEvent(
    event: InstagramMessagingEvent,
    pageId: string,
  ): NormalizedWebhookEvent | null {
    // Handle message event
    if (event.message && !event.message.is_echo && !event.message.is_deleted) {
      const direction: MessageDirection =
        event.sender.id === pageId ? 'outbound' : 'inbound';

      const contentType = this.determineContentType(event.message);
      const mediaUrl = this.extractMediaUrl(event.message);

      return {
        type: 'message',
        channelConversationId: this.buildConversationId(
          event.sender.id,
          event.recipient.id,
        ),
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
        channelConversationId: this.buildConversationId(
          event.sender.id,
          event.recipient.id,
        ),
        contactIdentifier: event.sender.id,
        status: {
          messageId: event.delivery.mids[0] ?? '',
          status: 'delivered' as MessageStatus,
        },
      };
    }

    // Handle read event
    if (event.read) {
      return {
        type: 'status_update',
        channelConversationId: this.buildConversationId(
          event.sender.id,
          event.recipient.id,
        ),
        contactIdentifier: event.sender.id,
        status: {
          messageId: `read_${event.read.watermark}`,
          status: 'read' as MessageStatus,
        },
      };
    }

    // Handle echo message (outbound message sent)
    if (event.message?.is_echo) {
      return {
        type: 'message',
        channelConversationId: this.buildConversationId(
          event.sender.id,
          event.recipient.id,
        ),
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
  private determineContentType(
    message: InstagramMessagingEvent['message'],
  ): MessageContentType {
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
  private extractMediaUrl(
    message: InstagramMessagingEvent['message'],
  ): string | undefined {
    if (!message?.attachments || message.attachments.length === 0) {
      return undefined;
    }
    return message.attachments[0].payload?.url;
  }

  /**
   * Build consistent conversation ID from participant IDs
   */
  private buildConversationId(senderId: string, recipientId: string): string {
    // Sort IDs to ensure consistent conversation ID regardless of direction
    const ids = [senderId, recipientId].sort();
    return `instagram_${ids[0]}_${ids[1]}`;
  }

  /**
   * Determine message direction based on sender
   */
  private determineDirection(
    senderId: string,
    _conversationId: string,
  ): MessageDirection {
    // This is a simplified version - in production you'd compare against
    // your business account ID stored in configuration
    // For now, we'll treat it as inbound by default (can be adjusted based on config)
    return 'inbound';
  }
}
