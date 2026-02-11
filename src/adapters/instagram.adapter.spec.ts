import { InstagramAdapter } from './instagram.adapter';
import type { OmnichannelModuleOptions } from '../interfaces';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('InstagramAdapter', () => {
  let adapter: InstagramAdapter;
  const mockOptions: OmnichannelModuleOptions = {
    twilio: {
      accountSid: '',
      authToken: '',
      conversationsServiceSid: '',
      whatsappNumber: '',
    },
    meta: {
      accessToken: 'EAAG_test_access_token',
      appSecret: 'app_secret_123',
      webhookVerifyToken: 'my_verify_token',
      pageId: 'PAGE123',
      instagramBusinessAccountId: 'IG_BIZ_123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new InstagramAdapter(mockOptions);
  });

  describe('constructor', () => {
    it('should initialize with Meta credentials', () => {
      expect(adapter.channel).toBe('instagram');
    });

    it('should handle missing credentials gracefully', () => {
      const adapterNoCredentials = new InstagramAdapter(undefined);
      expect(adapterNoCredentials.channel).toBe('instagram');
    });
  });

  describe('sendMessage', () => {
    it('should send a text message successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recipient_id: '12345',
          message_id: 'm_ABC123',
        }),
      });

      const result = await adapter.sendMessage('12345', {
        type: 'text',
        text: 'Hello Instagram!',
      });

      expect(result.success).toBe(true);
      expect(result.channelMessageId).toBe('m_ABC123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.instagram.com/v24.0/IG_BIZ_123/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer EAAG_test_access_token',
          },
          body: JSON.stringify({
            recipient: { id: '12345' },
            message: { text: 'Hello Instagram!' },
          }),
        }),
      );
    });

    it('should send an image message successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recipient_id: '12345',
          message_id: 'm_IMG123',
        }),
      });

      const result = await adapter.sendMessage('12345', {
        type: 'image',
        mediaUrl: 'https://example.com/image.jpg',
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            recipient: { id: '12345' },
            message: {
              attachment: {
                type: 'image',
                payload: {
                  url: 'https://example.com/image.jpg',
                  is_reusable: true,
                },
              },
            },
          }),
        }),
      );
    });

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Invalid recipient',
            type: 'OAuthException',
            code: 100,
          },
        }),
      });

      const result = await adapter.sendMessage('invalid_id', {
        type: 'text',
        text: 'Hello',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recipient');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await adapter.sendMessage('12345', {
        type: 'text',
        text: 'Hello',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should return error when access token not configured', async () => {
      const adapterNoToken = new InstagramAdapter(undefined);

      const result = await adapterNoToken.sendMessage('12345', {
        type: 'text',
        text: 'Hello',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Instagram access token not configured');
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send a template message successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recipient_id: '12345',
          message_id: 'm_TEMPLATE123',
        }),
      });

      const result = await adapter.sendTemplateMessage('12345', 'welcome', {
        title: 'Welcome!',
        subtitle: 'Thanks for contacting us',
      });

      expect(result.success).toBe(true);
      expect(result.channelMessageId).toBe('m_TEMPLATE123');
    });

    it('should handle template send error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Template not found',
            type: 'OAuthException',
            code: 100,
          },
        }),
      });

      const result = await adapter.sendTemplateMessage('12345', 'invalid_template', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
    });
  });

  describe('parseWebhookPayload', () => {
    it('should parse inbound message event', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [
              {
                sender: { id: 'USER456' },
                recipient: { id: 'PAGE123' },
                timestamp: 1706608800000,
                message: {
                  mid: 'm_ABC123',
                  text: 'Hello from user',
                },
              },
            ],
          },
        ],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('message');
      expect(result?.channelConversationId).toBe('instagram:USER456');
      expect(result?.message?.channelMessageId).toBe('m_ABC123');
      expect(result?.message?.contentText).toBe('Hello from user');
      expect(result?.message?.direction).toBe('inbound');
    });

    it('should parse message with image attachment', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [
              {
                sender: { id: 'USER456' },
                recipient: { id: 'PAGE123' },
                timestamp: 1706608800000,
                message: {
                  mid: 'm_IMG123',
                  attachments: [
                    {
                      type: 'image',
                      payload: {
                        url: 'https://cdn.instagram.com/image.jpg',
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.message?.contentType).toBe('image');
      expect(result?.message?.contentMediaUrl).toBe('https://cdn.instagram.com/image.jpg');
    });

    it('should parse delivery event', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [
              {
                sender: { id: 'USER456' },
                recipient: { id: 'PAGE123' },
                timestamp: 1706608800000,
                delivery: {
                  mids: ['m_ABC123'],
                  watermark: 1706608800000,
                },
              },
            ],
          },
        ],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.type).toBe('status_update');
      expect(result?.channelConversationId).toBe('instagram:USER456');
      expect(result?.status?.status).toBe('delivered');
      expect(result?.status?.messageId).toBe('m_ABC123');
    });

    it('should parse read event', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [
              {
                sender: { id: 'USER456' },
                recipient: { id: 'PAGE123' },
                timestamp: 1706608800000,
                read: {
                  watermark: 1706608800000,
                },
              },
            ],
          },
        ],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.type).toBe('status_update');
      expect(result?.channelConversationId).toBe('instagram:USER456');
      expect(result?.status?.status).toBe('read');
    });

    it('should parse echo message (outbound)', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [
              {
                sender: { id: 'PAGE123' },
                recipient: { id: 'USER456' },
                timestamp: 1706608800000,
                message: {
                  mid: 'm_ECHO123',
                  text: 'Hello from business',
                  is_echo: true,
                },
              },
            ],
          },
        ],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.channelConversationId).toBe('instagram:USER456');
      expect(result?.message?.direction).toBe('outbound');
      expect(result?.message?.metadata?.isEcho).toBe(true);
    });

    it('should skip deleted messages', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [
              {
                sender: { id: 'USER456' },
                recipient: { id: 'PAGE123' },
                timestamp: 1706608800000,
                message: {
                  mid: 'm_DELETED123',
                  text: 'Deleted message',
                  is_deleted: true,
                },
              },
            ],
          },
        ],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result).toBeNull();
    });

    it('should parse quick reply message', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [
              {
                sender: { id: 'USER456' },
                recipient: { id: 'PAGE123' },
                timestamp: 1706608800000,
                message: {
                  mid: 'm_QR123',
                  text: 'Yes',
                  quick_reply: {
                    payload: 'CONFIRM_YES',
                  },
                },
              },
            ],
          },
        ],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result?.message?.metadata?.isQuickReply).toBe(true);
      expect(result?.message?.metadata?.quickReplyPayload).toBe('CONFIRM_YES');
    });

    it('should return null for non-instagram webhook', () => {
      const payload = {
        object: 'page',
        entry: [],
      };

      const result = adapter.parseWebhookPayload(payload);

      expect(result).toBeNull();
    });

    it('should return null for empty messaging array', () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: 'PAGE123',
            time: 1706608800000,
            messaging: [],
          },
        ],
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'conv123',
              messages: {
                data: [
                  {
                    id: 'm_123',
                    message: 'Hello',
                    from: { id: 'user1', username: 'john_doe' },
                    to: { data: [{ id: 'page1' }] },
                    created_time: '2024-01-30T10:00:00Z',
                  },
                ],
              },
            },
          ],
        }),
      });

      const messages = await adapter.fetchMessages('conv123', { limit: 25 });

      expect(messages).toHaveLength(1);
      expect(messages[0].channelMessageId).toBe('m_123');
      expect(messages[0].senderName).toBe('john_doe');
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const messages = await adapter.fetchMessages('conv123');

      expect(messages).toEqual([]);
    });

    it('should return empty array when access token not configured', async () => {
      const adapterNoToken = new InstagramAdapter(undefined);

      const messages = await adapterNoToken.fetchMessages('conv123');

      expect(messages).toEqual([]);
    });

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const messages = await adapter.fetchMessages('conv123');

      expect(messages).toEqual([]);
    });
  });

  describe('verifyWebhook', () => {
    it('should return true for valid verify token', () => {
      const result = adapter.verifyWebhook('my_verify_token');
      expect(result).toBe(true);
    });

    it('should return false for invalid verify token', () => {
      const result = adapter.verifyWebhook('wrong_token');
      expect(result).toBe(false);
    });
  });
});
