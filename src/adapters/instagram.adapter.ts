import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import type { ChannelAdapter, AdapterCredentialsOverride } from './channel.adapter.interface';
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
  private readonly pageId: string;
  private readonly instagramBusinessAccountId: string;
  private readonly apiVersion = 'v24.0';
  private readonly graphBaseUrl = 'https://graph.facebook.com';
  private readonly igBaseUrl = 'https://graph.instagram.com';

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
  private resolveCredentials(credentials?: AdapterCredentialsOverride) {
    const meta = credentials?.meta;
    return {
      accessToken: meta?.accessToken || this.accessToken,
      pageId: meta?.pageId || this.pageId,
      instagramBusinessAccountId:
        meta?.instagramBusinessAccountId || this.instagramBusinessAccountId,
    };
  }

  /**
   * Send a message via Instagram Messaging API (using Facebook Graph API)
   * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
   */
  async sendMessage(
    to: string,
    content: MessageContent,
    credentials?: AdapterCredentialsOverride,
  ): Promise<SendMessageResult> {
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

      const requestBody: Record<string, unknown> = {
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

      const result = (await response.json()) as InstagramApiResponse;

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
   * Note: Instagram has limited template support compared to Messenger
   */
  async sendTemplateMessage(
    to: string,
    templateId: string,
    variables: Record<string, string>,
    credentials?: AdapterCredentialsOverride,
  ): Promise<SendMessageResult> {
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

      const result = (await response.json()) as InstagramApiResponse;

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
   * Uses Facebook Graph API for Instagram messaging
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

      const data = (await response.json()) as InstagramConversationResponse;
      const messages: NormalizedMessage[] = [];

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
   * Fetch Instagram user profile (username, name)
   */
  async fetchUserProfile(
    userId: string,
    credentials?: AdapterCredentialsOverride,
  ): Promise<{
    id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  } | null> {
    try {
      const accessToken = credentials?.meta?.accessToken || this.accessToken;
      if (!accessToken) {
        throw new Error('Instagram access token not configured');
      }

      const url = `${this.igBaseUrl}/${this.apiVersion}/${userId}?fields=username,name,profile_picture_url`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        this.logger.warn(`Failed to fetch Instagram user profile: ${response.status}`);
        return null;
      }

      const data = await response.json() as {
        id: string;
        username?: string;
        name?: string;
        profile_picture_url?: string;
      };

      this.logger.log(`Fetched Instagram profile for ${userId}: @${data.username}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch Instagram user profile for ${userId}`, error);
      return null;
    }
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
   * @param event - The messaging event from webhook
   * @param entryId - The entry ID (Instagram Business Account ID from webhook)
   */
  private parseMessagingEvent(
    event: InstagramMessagingEvent,
    entryId: string,
  ): NormalizedWebhookEvent | null {
    // Handle message event
    if (event.message && !event.message.is_echo && !event.message.is_deleted) {
      // Use configured business account ID if available, otherwise fall back to entry ID
      const businessAccountId = this.instagramBusinessAccountId || entryId;
      const direction: MessageDirection =
        event.sender.id === businessAccountId ? 'outbound' : 'inbound';

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
          status: 'delivered' as MessageStatus,
        },
      };
    }

    // Handle read event
    if (event.read) {
      return {
        type: 'status_update',
        channelConversationId: this.buildConversationId(event.sender.id),
        contactIdentifier: event.sender.id,
        channelAccountId: entryId,
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
        channelConversationId: this.buildConversationId(event.recipient.id),
        contactIdentifier: event.recipient.id,
        channelAccountId: entryId,
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
   * Build conversation ID from contact (customer) identifier
   */
  private buildConversationId(contactIdentifier: string): string {
    return `instagram:${contactIdentifier}`;
  }

  /**
   * Determine message direction based on sender ID
   * Compares against configured Instagram Business Account ID
   */
  private determineDirectionById(senderId: string): MessageDirection {
    // If no business account ID configured, default to inbound for safety
    if (!this.instagramBusinessAccountId) {
      return 'inbound';
    }
    // If sender is our business account, it's an outbound message
    return senderId === this.instagramBusinessAccountId ? 'outbound' : 'inbound';
  }

}
