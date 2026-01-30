import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Twilio, jwt } from 'twilio';
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
import type { TwilioWebhookDto } from '../dto';
import {
  OMNICHANNEL_MODULE_OPTIONS,
  type OmnichannelModuleOptions,
} from '../interfaces';

const { AccessToken } = jwt;
const { ChatGrant } = AccessToken;

@Injectable()
export class WhatsAppAdapter implements ChannelAdapter {
  private readonly logger = new Logger(WhatsAppAdapter.name);
  private readonly client: Twilio | null = null;
  private readonly conversationsServiceSid: string;
  private readonly whatsappNumber: string;
  private readonly apiKeySid: string;
  private readonly apiKeySecret: string;
  private readonly accountSid: string;

  readonly channel: ChannelType = 'whatsapp';

  constructor(
    @Optional()
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly options?: OmnichannelModuleOptions,
  ) {
    const twilio = options?.twilio;
    this.accountSid = twilio?.accountSid ?? '';
    this.conversationsServiceSid = twilio?.conversationsServiceSid ?? '';
    this.whatsappNumber = twilio?.whatsappNumber ?? '';
    this.apiKeySid = twilio?.apiKeySid ?? '';
    this.apiKeySecret = twilio?.apiKeySecret ?? '';

    if (twilio?.accountSid && twilio?.authToken) {
      this.client = new Twilio(twilio.accountSid, twilio.authToken);
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  async sendMessage(
    to: string,
    content: MessageContent,
  ): Promise<SendMessageResult> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const fromWhatsapp = `whatsapp:${this.whatsappNumber}`;

      const messageOptions: {
        from: string;
        to: string;
        body?: string;
        mediaUrl?: string[];
      } = {
        from: fromWhatsapp,
        to: toWhatsapp,
      };

      if (content.type === 'text' && content.text) {
        messageOptions.body = content.text;
      } else if (
        (content.type === 'image' || content.type === 'file') &&
        content.mediaUrl
      ) {
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
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendTemplateMessage(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<SendMessageResult> {
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
    } catch (error) {
      this.logger.error('Failed to send WhatsApp template message', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null {
    try {
      const twilioPayload = payload as TwilioWebhookDto;

      if (twilioPayload.EventType === 'onMessageAdded') {
        const direction: MessageDirection =
          twilioPayload.Source === 'SDK' ? 'outbound' : 'inbound';

        const contentType: MessageContentType = twilioPayload.MediaContentType
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

      if (
        ['onMessageUpdated', 'onDeliveryUpdated'].includes(
          twilioPayload.EventType,
        )
      ) {
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
    } catch (error) {
      this.logger.error('Failed to parse Twilio webhook payload', error);
      return null;
    }
  }

  async fetchMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<NormalizedMessage[]> {
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
          : 'outbound') as MessageDirection,
        senderName: msg.author ?? '',
        contentType: 'text' as MessageContentType,
        contentText: msg.body ?? undefined,
        timestamp: msg.dateCreated,
        metadata: {
          participantSid: msg.participantSid,
          index: msg.index,
        },
      }));
    } catch (error) {
      this.logger.error('Failed to fetch messages from Twilio', error);
      return [];
    }
  }

  async generateAccessToken(identity: string): Promise<string> {
    const token = new AccessToken(
      this.accountSid,
      this.apiKeySid,
      this.apiKeySecret,
      { identity },
    );

    const chatGrant = new ChatGrant({
      serviceSid: this.conversationsServiceSid,
    });

    token.addGrant(chatGrant);

    return token.toJwt();
  }

  private mapMediaType(contentType: string): MessageContentType {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
    return 'file';
  }

  private mapTwilioStatus(eventType: string): MessageStatus {
    switch (eventType) {
      case 'onDeliveryUpdated':
        return 'delivered';
      case 'onMessageUpdated':
        return 'read';
      default:
        return 'sent';
    }
  }
}
