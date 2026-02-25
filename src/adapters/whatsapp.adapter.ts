import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Twilio, jwt } from 'twilio';
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
  private readonly appUrl: string;

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
    this.appUrl = options?.appUrl ?? '';

    if (twilio?.accountSid && twilio?.authToken) {
      this.client = new Twilio(twilio.accountSid, twilio.authToken);
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  /**
   * Resolve Twilio client: override credentials가 기본값과 다르면 새 클라이언트 생성
   */
  private resolveTwilioClient(credentials?: AdapterCredentialsOverride): {
    client: Twilio | null;
    whatsappNumber: string;
  } {
    const twilio = credentials?.twilio;
    if (
      twilio?.accountSid &&
      twilio?.authToken &&
      twilio.accountSid !== this.accountSid
    ) {
      return {
        client: new Twilio(twilio.accountSid, twilio.authToken),
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
  async sendMessage(
    to: string,
    content: MessageContent,
    credentials?: AdapterCredentialsOverride,
  ): Promise<SendMessageResult> {
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
  private async sendMessageViaMessagingApi(
    to: string,
    content: MessageContent,
    credentials?: AdapterCredentialsOverride,
  ): Promise<SendMessageResult> {
    try {
      const { client, whatsappNumber } = this.resolveTwilioClient(credentials);
      if (!client) {
        throw new Error('Twilio client not initialized');
      }

      const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const fromWhatsapp = `whatsapp:${whatsappNumber}`;

      const messageOptions: {
        from: string;
        to: string;
        body?: string;
        mediaUrl?: string[];
        statusCallback?: string;
      } = {
        from: fromWhatsapp,
        to: toWhatsapp,
      };

      if (this.appUrl) {
        messageOptions.statusCallback = `${this.appUrl}/webhooks/twilio/status`;
      }

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

      const message = await client.messages.create(messageOptions);

      this.logger.log(`Message sent via Messaging API: ${message.sid}`);

      return {
        success: true,
        channelMessageId: message.sid,
      };
    } catch (error) {
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
  private async sendMessageViaConversationsApi(
    conversationSid: string,
    content: MessageContent,
    credentials?: AdapterCredentialsOverride,
  ): Promise<SendMessageResult> {
    try {
      const { client } = this.resolveTwilioClient(credentials);
      if (!client) {
        throw new Error('Twilio client not initialized');
      }

      const messageOptions: {
        body?: string;
        mediaSid?: string;
      } = {};

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
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message via Conversations API', error);
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
    credentials?: AdapterCredentialsOverride,
  ): Promise<SendMessageResult> {
    try {
      const { client, whatsappNumber } = this.resolveTwilioClient(credentials);
      if (!client) {
        throw new Error('Twilio client not initialized');
      }

      const toWhatsapp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const fromWhatsapp = `whatsapp:${whatsappNumber}`;

      const message = await client.messages.create({
        from: fromWhatsapp,
        to: toWhatsapp,
        contentSid: templateId,
        contentVariables: JSON.stringify(variables),
        ...(this.appUrl && { statusCallback: `${this.appUrl}/webhooks/twilio/status` }),
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

      // Detect webhook format: Conversations API vs Messaging API
      if (twilioPayload.EventType) {
        // Conversations API format
        return this.parseConversationsApiPayload(twilioPayload);
      } else if (twilioPayload.SmsMessageSid || twilioPayload.MessageSid || twilioPayload.From) {
        // Messaging API format (Sandbox)
        return this.parseMessagingApiPayload(twilioPayload);
      }

      this.logger.warn('Unknown Twilio webhook format', { payload });
      return null;
    } catch (error) {
      this.logger.error('Failed to parse Twilio webhook payload', error);
      return null;
    }
  }

  /**
   * Parse Twilio Conversations API webhook payload
   */
  private parseConversationsApiPayload(
    twilioPayload: TwilioWebhookDto,
  ): NormalizedWebhookEvent | null {
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
        twilioPayload.EventType ?? '',
      )
    ) {
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
  private parseMessagingApiPayload(
    twilioPayload: TwilioWebhookDto,
  ): NormalizedWebhookEvent | null {
    const messageSid = twilioPayload.SmsMessageSid ?? twilioPayload.MessageSid;
    const from = twilioPayload.From ?? '';
    const to = twilioPayload.To ?? '';

    // Check if this is a status callback (has SmsStatus but minimal content)
    if (twilioPayload.SmsStatus && !twilioPayload.Body && !twilioPayload.NumMedia) {
      const rawPayload = twilioPayload as Record<string, string | undefined>;
      return {
        type: 'status_update',
        channelConversationId: from, // Use From as conversation identifier
        contactIdentifier: from,
        status: {
          messageId: messageSid ?? '',
          status: this.mapMessagingApiStatus(twilioPayload.SmsStatus),
          errorCode: rawPayload['ErrorCode'] ? parseInt(rawPayload['ErrorCode'], 10) : undefined,
          errorMessage: rawPayload['ErrorMessage'] ?? undefined,
        },
      };
    }

    // Check if this is a reaction (ButtonPayload with emoji, no Body)
    const rawPayloadForReaction = twilioPayload as Record<string, string | undefined>;
    const buttonPayload = rawPayloadForReaction['ButtonPayload'];
    const originalMessageSid = rawPayloadForReaction['OriginalRepliedMessageSid'];
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
    const direction: MessageDirection = isInbound ? 'inbound' : 'outbound';
    const businessNumber = isInbound ? to : from;

    // Use From as conversation ID (each sender gets their own conversation)
    const conversationId = isInbound ? from : to;
    const contactIdentifier = isInbound ? from : to;

    // Handle media attachments
    const numMedia = parseInt(twilioPayload.NumMedia ?? '0', 10);
    let contentType: MessageContentType = 'text';
    let mediaUrl: string | undefined;

    if (numMedia > 0) {
      // Twilio sends MediaUrl0, MediaContentType0, etc. for each attachment
      const rawPayload = twilioPayload as Record<string, string | undefined>;
      const mediaContentType = rawPayload['MediaContentType0'];
      mediaUrl = rawPayload['MediaUrl0'];

      if (mediaContentType) {
        contentType = this.mapMediaType(mediaContentType);
      }
    }

    // Extract contact name from ProfileName (WhatsApp) or use identifier
    const senderName = twilioPayload.ProfileName ?? from;

    this.logger.log(
      `Parsed Messaging API webhook: ${messageSid} from ${from} (${senderName})`,
    );

    // Extract reply context from Twilio webhook (OriginalRepliedMessageSid)
    const rawPayloadForReply = twilioPayload as Record<string, string | undefined>;
    const replyToExternalId = rawPayloadForReply['OriginalRepliedMessageSid'] ?? undefined;

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
        replyToExternalId,
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

  /**
   * Map Messaging API status to internal status
   * https://www.twilio.com/docs/sms/api/message-resource#message-status-values
   */
  private mapMessagingApiStatus(smsStatus: string): MessageStatus {
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
}
