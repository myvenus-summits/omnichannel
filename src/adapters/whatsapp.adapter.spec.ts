// Mock Twilio - must be before import
const mockCreate = jest.fn();
const mockList = jest.fn();

jest.mock('twilio', () => {
  const mockTwilioClient = {
    messages: {
      create: mockCreate,
    },
    conversations: {
      v1: {
        conversations: jest.fn().mockReturnValue({
          messages: {
            list: mockList,
          },
        }),
      },
    },
  };

  // Mock ChatGrant constructor
  const MockChatGrant = jest.fn().mockImplementation(() => ({}));

  // Create AccessToken constructor with ChatGrant static property
  const MockAccessToken = jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockReturnValue('mock-jwt-token'),
  }));
  (MockAccessToken as { ChatGrant: jest.Mock }).ChatGrant = MockChatGrant;

  return {
    Twilio: jest.fn().mockImplementation(() => mockTwilioClient),
    jwt: {
      AccessToken: MockAccessToken,
    },
  };
});

import { WhatsAppAdapter } from './whatsapp.adapter';
import type { OmnichannelModuleOptions } from '../interfaces';

describe('WhatsAppAdapter', () => {
  let adapter: WhatsAppAdapter;
  const mockOptions: OmnichannelModuleOptions = {
    twilio: {
      accountSid: 'AC123456789',
      authToken: 'auth-token-123',
      conversationsServiceSid: 'IS123456789',
      whatsappNumber: '+14155551234',
      apiKeySid: 'SK123456789',
      apiKeySecret: 'api-key-secret',
    },
    meta: {
      accessToken: '',
      appSecret: '',
      webhookVerifyToken: '',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new WhatsAppAdapter(mockOptions);
  });

  describe('constructor', () => {
    it('should initialize with Twilio credentials', () => {
      expect(adapter.channel).toBe('whatsapp');
    });

    it('should handle missing credentials gracefully', () => {
      const adapterNoCredentials = new WhatsAppAdapter(undefined);
      expect(adapterNoCredentials.channel).toBe('whatsapp');
    });
  });

  describe('sendMessage', () => {
    it('should send a text message successfully', async () => {
      mockCreate.mockResolvedValueOnce({ sid: 'SM123456789' });

      const result = await adapter.sendMessage('+821012345678', {
        type: 'text',
        text: 'Hello, World!',
      });

      expect(result.success).toBe(true);
      expect(result.channelMessageId).toBe('SM123456789');
      expect(mockCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+14155551234',
        to: 'whatsapp:+821012345678',
        body: 'Hello, World!',
      });
    });

    it('should send message with whatsapp: prefix already present', async () => {
      mockCreate.mockResolvedValueOnce({ sid: 'SM123456789' });

      await adapter.sendMessage('whatsapp:+821012345678', {
        type: 'text',
        text: 'Test',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'whatsapp:+821012345678',
        }),
      );
    });

    it('should send an image message successfully', async () => {
      mockCreate.mockResolvedValueOnce({ sid: 'SM987654321' });

      const result = await adapter.sendMessage('+821012345678', {
        type: 'image',
        mediaUrl: 'https://example.com/image.jpg',
        text: 'Check this out!',
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+14155551234',
        to: 'whatsapp:+821012345678',
        mediaUrl: ['https://example.com/image.jpg'],
        body: 'Check this out!',
      });
    });

    it('should handle send failure', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API Error'));

      const result = await adapter.sendMessage('+821012345678', {
        type: 'text',
        text: 'Hello',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should return error when client not initialized', async () => {
      const adapterNoClient = new WhatsAppAdapter(undefined);

      const result = await adapterNoClient.sendMessage('+821012345678', {
        type: 'text',
        text: 'Hello',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Twilio client not initialized');
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send a template message successfully', async () => {
      mockCreate.mockResolvedValueOnce({ sid: 'SM111222333' });

      const result = await adapter.sendTemplateMessage(
        '+821012345678',
        'HXTEMPLATE123',
        { name: 'John', date: '2024-01-30' },
      );

      expect(result.success).toBe(true);
      expect(result.channelMessageId).toBe('SM111222333');
      expect(mockCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+14155551234',
        to: 'whatsapp:+821012345678',
        contentSid: 'HXTEMPLATE123',
        contentVariables: JSON.stringify({ name: 'John', date: '2024-01-30' }),
      });
    });

    it('should handle template send failure', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Template not found'));

      const result = await adapter.sendTemplateMessage(
        '+821012345678',
        'INVALID_TEMPLATE',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
    });
  });

  describe('parseWebhookPayload', () => {
    it('should parse onMessageAdded event for inbound message', () => {
      const payload = {
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        MessageSid: 'IM987654321',
        Author: 'whatsapp:+821012345678',
        Body: 'Hello from customer',
        Source: 'API',
        DateCreated: '2024-01-30T10:00:00Z',
        ParticipantSid: 'MB123456',
        AccountSid: 'AC123456',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('message');
      expect(result?.channelConversationId).toBe('CH123456789');
      expect(result?.message?.direction).toBe('inbound');
      expect(result?.message?.contentText).toBe('Hello from customer');
      expect(result?.message?.channelMessageId).toBe('IM987654321');
    });

    it('should parse onMessageAdded event for outbound message (SDK)', () => {
      const payload = {
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        MessageSid: 'IM987654321',
        Author: 'system',
        Body: 'Hello from business',
        Source: 'SDK',
        DateCreated: '2024-01-30T10:00:00Z',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.message?.direction).toBe('outbound');
    });

    it('should classify REST API self-echo (Source=API from our number) as outbound', () => {
      // Regression (MW-90 Bug 2): a message we send via the REST API is echoed
      // back with Source='API' — the same value inbound customer messages carry.
      // Author identity (our business number) must drive the direction.
      const payload = {
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        MessageSid: 'IM555000111',
        Author: 'whatsapp:+14155551234', // our business number (mockOptions)
        Body: 'Reply sent via REST API',
        Source: 'API',
        DateCreated: '2024-01-30T10:05:00Z',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.message?.direction).toBe('outbound');
    });

    it('should keep customer message (Source=API from customer number) as inbound', () => {
      // Guards the fix above from over-classifying: a customer message also has
      // Source='API' but a non-business Author, so it must stay inbound.
      const payload = {
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        MessageSid: 'IM555000222',
        Author: 'whatsapp:+821099998888',
        Body: 'Customer message',
        Source: 'API',
        DateCreated: '2024-01-30T10:06:00Z',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.message?.direction).toBe('inbound');
    });

    it('should synthesize a deterministic id when MessageSid is missing or blank', () => {
      // Regression (MW-90 Bug 1): a missing/blank MessageSid must not become ''
      // (which would silently merge distinct messages under the server upsert).
      const base = {
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        Author: 'whatsapp:+821012345678',
        Body: 'No sid here',
        Source: 'API',
        ParticipantSid: 'MB000111',
        DateCreated: '2024-01-30T10:07:00Z',
      };

      const missing = adapter.parseWebhookPayload({ ...base });
      const blank = adapter.parseWebhookPayload({ ...base, MessageSid: '   ' });

      const id = missing?.message?.channelMessageId;
      expect(id).toBeTruthy();
      expect(id).not.toBe('');
      expect(id).toMatch(/^wa-fallback-/);
      // Blank string is treated the same as missing.
      expect(blank?.message?.channelMessageId).toBe(id);
      // Deterministic: same payload → same id (so retried webhooks dedup).
      expect(adapter.parseWebhookPayload({ ...base })?.message?.channelMessageId).toBe(id);
    });

    it('should produce distinct fallback ids for distinct sid-less messages', () => {
      // Two different messages (different ParticipantSid) must not collapse to
      // one id — otherwise the empty-string merge bug just moves to the fallback.
      const a = adapter.parseWebhookPayload({
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        Author: 'whatsapp:+821012345678',
        Body: 'first',
        ParticipantSid: 'MB000111',
        DateCreated: '2024-01-30T10:08:00Z',
      });
      const b = adapter.parseWebhookPayload({
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        Author: 'whatsapp:+821012345678',
        Body: 'second',
        ParticipantSid: 'MB000222',
        DateCreated: '2024-01-30T10:09:00Z',
      });

      expect(a?.message?.channelMessageId).not.toBe(b?.message?.channelMessageId);
    });

    it('should synthesize a non-empty id for a Messaging API message missing SmsMessageSid', () => {
      const payload = {
        From: 'whatsapp:+821012345678',
        To: 'whatsapp:+14155551234',
        Body: 'Sandbox message without sid',
        NumMedia: '0',
        WaId: '821012345678',
      };

      const result = adapter.parseWebhookPayload(payload);

      const id = result?.message?.channelMessageId;
      expect(id).toBeTruthy();
      expect(id).not.toBe('');
      expect(id).toMatch(/^wa-fallback-/);
    });

    it('should parse onConversationAdded event', () => {
      const payload = {
        EventType: 'onConversationAdded',
        ConversationSid: 'CH123456789',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.type).toBe('conversation_created');
      expect(result?.channelConversationId).toBe('CH123456789');
    });

    it('should parse onDeliveryUpdated event', () => {
      const payload = {
        EventType: 'onDeliveryUpdated',
        ConversationSid: 'CH123456789',
        MessageSid: 'IM987654321',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.type).toBe('status_update');
      expect(result?.status?.status).toBe('delivered');
    });

    it('should parse message with media', () => {
      const payload = {
        EventType: 'onMessageAdded',
        ConversationSid: 'CH123456789',
        MessageSid: 'IM987654321',
        Author: 'whatsapp:+821012345678',
        Body: '',
        MediaContentType: 'image/jpeg',
        MediaUrl: 'https://twilio.com/media/123.jpg',
        Source: 'API',
        DateCreated: '2024-01-30T10:00:00Z',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.message?.contentType).toBe('image');
      expect(result?.message?.contentMediaUrl).toBe('https://twilio.com/media/123.jpg');
    });

    it('should capture Click-to-WhatsApp ad referral into message metadata', () => {
      const payload = {
        SmsMessageSid: 'SM123456789',
        MessageSid: 'SM123456789',
        From: 'whatsapp:+821012345678',
        To: 'whatsapp:+14155551234',
        ProfileName: 'Jane Doe',
        Body: 'Hi, I saw your ad',
        NumMedia: '0',
        ReferralCtwaClid: 'ARxxxxCtwaClid',
        ReferralSourceId: '120209000000000',
        ReferralSourceType: 'ad',
        ReferralSourceUrl: 'https://fb.me/abc',
        ReferralHeadline: 'Glow up at MyWave',
        ReferralBody: 'Book your consultation today',
        ReferralMediaId: '987654321',
        ReferralMediaContentType: 'image/jpeg',
        ReferralMediaUrl: 'https://twilio.com/ad-media.jpg',
        ReferralNumMedia: '1',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.type).toBe('message');
      expect(result?.message?.direction).toBe('inbound');
      const referral = result?.message?.metadata?.referral as
        | Record<string, string>
        | undefined;
      expect(referral).toBeDefined();
      expect(referral?.ctwaClid).toBe('ARxxxxCtwaClid');
      expect(referral?.sourceId).toBe('120209000000000');
      expect(referral?.sourceType).toBe('ad');
      expect(referral?.headline).toBe('Glow up at MyWave');
      expect(referral?.body).toBe('Book your consultation today');
      expect(referral?.mediaContentType).toBe('image/jpeg');
      expect(referral?.numMedia).toBe('1');
    });

    it('should not attach referral metadata for organic (non-ad) messages', () => {
      const payload = {
        SmsMessageSid: 'SM987654321',
        MessageSid: 'SM987654321',
        From: 'whatsapp:+821012345678',
        To: 'whatsapp:+14155551234',
        ProfileName: 'Jane Doe',
        Body: 'Just a normal message',
        NumMedia: '0',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.type).toBe('message');
      expect(result?.message?.metadata).toBeDefined();
      expect(result?.message?.metadata).not.toHaveProperty('referral');
    });

    it('should return null for unknown event type', () => {
      const payload = {
        EventType: 'unknownEvent',
        ConversationSid: 'CH123456789',
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result).toBeNull();
    });

    it('should return null for invalid payload', () => {
      const result = adapter.parseWebhookPayload(null);
      expect(result).toBeNull();
    });
  });

  describe('fetchMessages', () => {
    it('should fetch messages from conversation', async () => {
      mockList.mockResolvedValueOnce([
        {
          sid: 'IM123',
          author: 'whatsapp:+821012345678',
          body: 'Hello',
          dateCreated: new Date('2024-01-30T10:00:00Z'),
          participantSid: 'MB123',
          index: 0,
        },
        {
          sid: 'IM124',
          author: 'system',
          body: 'Hi there!',
          dateCreated: new Date('2024-01-30T10:01:00Z'),
          participantSid: 'MB124',
          index: 1,
        },
      ]);

      const messages = await adapter.fetchMessages('CH123456789', { limit: 50 });

      expect(messages).toHaveLength(2);
      expect(messages[0].channelMessageId).toBe('IM123');
      expect(messages[0].direction).toBe('inbound');
      expect(messages[1].direction).toBe('outbound');
    });

    it('should return empty array on error', async () => {
      mockList.mockRejectedValueOnce(new Error('API Error'));

      const messages = await adapter.fetchMessages('CH123456789');

      expect(messages).toEqual([]);
    });

    it('should return empty array when client not initialized', async () => {
      const adapterNoClient = new WhatsAppAdapter(undefined);

      const messages = await adapterNoClient.fetchMessages('CH123456789');

      expect(messages).toEqual([]);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', async () => {
      const token = await adapter.generateAccessToken('user123');

      expect(token).toBe('mock-jwt-token');
    });
  });
});
