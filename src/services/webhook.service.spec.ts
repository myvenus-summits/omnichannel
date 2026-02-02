import { WebhookService } from './webhook.service';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import type { OmnichannelModuleOptions, IConversationRepository, IMessageRepository, IConversation, IMessage } from '../interfaces';

// Mock repositories (implementing interfaces)
const mockConversationRepository: jest.Mocked<IConversationRepository> = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByChannelConversationId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  incrementUnreadCount: jest.fn(),
  updateLastMessage: jest.fn(),
};

const mockMessageRepository: jest.Mocked<IMessageRepository> = {
  findByConversation: jest.fn(),
  findOne: jest.fn(),
  findByChannelMessageId: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};

// Mock adapters
const mockWhatsAppAdapter = {
  parseWebhookPayload: jest.fn(),
  channel: 'whatsapp' as const,
};

const mockInstagramAdapter = {
  parseWebhookPayload: jest.fn(),
  channel: 'instagram' as const,
};

// Mock gateway
const mockGateway = {
  emitNewMessage: jest.fn(),
  emitConversationUpdate: jest.fn(),
};

// Mock services
const mockConversationService = {
  findByChannelConversationId: jest.fn(),
  create: jest.fn(),
};

const mockMessageService = {
  updateStatus: jest.fn(),
};

describe('WebhookService', () => {
  let service: WebhookService;
  const mockOptions: OmnichannelModuleOptions = {
    appUrl: 'https://api.example.com',
    twilio: {
      accountSid: 'AC123',
      authToken: 'auth-token',
      conversationsServiceSid: 'IS123',
      whatsappNumber: '+1234567890',
    },
    meta: {
      appId: 'app123',
      appSecret: 'secret',
      accessToken: 'token',
      webhookVerifyToken: 'verify_token_123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebhookService(
      mockOptions,
      mockConversationRepository,
      mockMessageRepository,
      mockWhatsAppAdapter as unknown as WhatsAppAdapter,
      mockInstagramAdapter as unknown as InstagramAdapter,
      mockGateway as unknown as OmnichannelGateway,
      mockConversationService as unknown as ConversationService,
      mockMessageService as unknown as MessageService,
    );
  });

  describe('handleTwilioWebhook', () => {
    it('should process a valid Twilio message event', async () => {
      const mockEvent = {
        type: 'message' as const,
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        message: {
          channelMessageId: 'IM123',
          direction: 'inbound' as const,
          senderName: 'Customer',
          contentType: 'text' as const,
          contentText: 'Hello',
          timestamp: new Date(),
        },
      };

      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(mockEvent);

      const mockConversation: IConversation = {
        id: 1,
        channel: 'whatsapp',
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        contactName: null,
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 0,
        lastMessageAt: null,
        lastMessagePreview: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedConversation: IConversation = { ...mockConversation, unreadCount: 1 };
      const mockMessage: IMessage = {
        id: 1,
        conversationId: 1,
        channelMessageId: 'IM123',
        direction: 'inbound',
        senderName: 'Customer',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hello',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockConversationRepository.findByChannelConversationId.mockResolvedValue(null);
      mockConversationRepository.create.mockResolvedValue(mockConversation);
      mockConversationRepository.update.mockResolvedValue(mockUpdatedConversation);
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);
      mockMessageRepository.create.mockResolvedValue(mockMessage);

      await service.handleTwilioWebhook({ EventType: 'onMessageAdded' });

      expect(mockWhatsAppAdapter.parseWebhookPayload).toHaveBeenCalled();
      expect(mockConversationRepository.create).toHaveBeenCalled();
      expect(mockMessageRepository.create).toHaveBeenCalled();
      expect(mockGateway.emitNewMessage).toHaveBeenCalled();
      expect(mockGateway.emitConversationUpdate).toHaveBeenCalled();
    });

    it('should handle existing conversation', async () => {
      const mockEvent = {
        type: 'message' as const,
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        message: {
          channelMessageId: 'IM456',
          direction: 'inbound' as const,
          senderName: 'Customer',
          contentType: 'text' as const,
          contentText: 'Follow up',
          timestamp: new Date(),
        },
      };

      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(mockEvent);

      const existingConversation: IConversation = {
        id: 1,
        channel: 'whatsapp',
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        contactName: null,
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 5,
        lastMessageAt: null,
        lastMessagePreview: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessage: IMessage = {
        id: 2,
        conversationId: 1,
        channelMessageId: 'IM456',
        direction: 'inbound',
        senderName: 'Customer',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Follow up',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockConversationRepository.findByChannelConversationId.mockResolvedValue(existingConversation);
      mockConversationRepository.update.mockResolvedValue({ ...existingConversation, unreadCount: 6 });
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);
      mockMessageRepository.create.mockResolvedValue(mockMessage);

      await service.handleTwilioWebhook({ EventType: 'onMessageAdded' });

      expect(mockConversationRepository.create).not.toHaveBeenCalled();
      expect(mockConversationRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          unreadCount: 6,
        }),
      );
    });

    it('should not increment unread count for outbound messages', async () => {
      const mockEvent = {
        type: 'message' as const,
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        message: {
          channelMessageId: 'IM789',
          direction: 'outbound' as const,
          senderName: 'Agent',
          contentType: 'text' as const,
          contentText: 'Reply',
          timestamp: new Date(),
        },
      };

      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(mockEvent);

      const existingConversation: IConversation = {
        id: 1,
        channel: 'whatsapp',
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        contactName: null,
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 3,
        lastMessageAt: null,
        lastMessagePreview: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessage: IMessage = {
        id: 3,
        conversationId: 1,
        channelMessageId: 'IM789',
        direction: 'outbound',
        senderName: 'Agent',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Reply',
        contentMediaUrl: null,
        status: 'sent',
        metadata: null,
        createdAt: new Date(),
      };

      mockConversationRepository.findByChannelConversationId.mockResolvedValue(existingConversation);
      mockConversationRepository.update.mockResolvedValue(existingConversation);
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);
      mockMessageRepository.create.mockResolvedValue(mockMessage);

      await service.handleTwilioWebhook({ EventType: 'onMessageAdded' });

      expect(mockConversationRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          unreadCount: 3, // Should not increment
        }),
      );
    });

    it('should skip invalid payloads', async () => {
      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(null);

      await service.handleTwilioWebhook({});

      expect(mockConversationRepository.findByChannelConversationId).not.toHaveBeenCalled();
    });

    it('should handle status update events', async () => {
      const mockEvent = {
        type: 'status_update' as const,
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        status: {
          messageId: 'IM123',
          status: 'delivered' as const,
        },
      };

      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(mockEvent);

      await service.handleTwilioWebhook({ EventType: 'onDeliveryUpdated' });

      expect(mockMessageService.updateStatus).toHaveBeenCalledWith(
        'IM123',
        'delivered',
      );
    });

    it('should handle conversation_created events', async () => {
      const mockEvent = {
        type: 'conversation_created' as const,
        channelConversationId: 'CH_NEW_123',
        contactIdentifier: '',
      };

      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(mockEvent);
      mockConversationService.findByChannelConversationId.mockResolvedValue(null);

      await service.handleTwilioWebhook({ EventType: 'onConversationAdded' });

      expect(mockConversationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'whatsapp',
          channelConversationId: 'CH_NEW_123',
          status: 'open',
        }),
      );
    });

    it('should not create duplicate conversation', async () => {
      const mockEvent = {
        type: 'conversation_created' as const,
        channelConversationId: 'CH_EXISTING',
        contactIdentifier: '',
      };

      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(mockEvent);
      mockConversationService.findByChannelConversationId.mockResolvedValue({ id: 1 });

      await service.handleTwilioWebhook({ EventType: 'onConversationAdded' });

      expect(mockConversationService.create).not.toHaveBeenCalled();
    });
  });

  describe('handleMetaWebhook', () => {
    it('should route Instagram webhooks correctly', async () => {
      const mockEvent = {
        type: 'message' as const,
        channelConversationId: 'instagram_123_456',
        contactIdentifier: 'user123',
        message: {
          channelMessageId: 'm_ABC123',
          direction: 'inbound' as const,
          senderName: 'user123',
          contentType: 'text' as const,
          contentText: 'Hi from Instagram',
          timestamp: new Date(),
        },
      };

      mockInstagramAdapter.parseWebhookPayload.mockReturnValue(mockEvent);

      const mockConversation: IConversation = {
        id: 1,
        channel: 'instagram',
        channelConversationId: 'instagram_123_456',
        contactIdentifier: 'user123',
        contactName: 'user123',
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 0,
        lastMessageAt: null,
        lastMessagePreview: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessage: IMessage = {
        id: 1,
        conversationId: 1,
        channelMessageId: 'm_ABC123',
        direction: 'inbound',
        senderName: 'user123',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hi from Instagram',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockConversationRepository.findByChannelConversationId.mockResolvedValue(null);
      mockConversationRepository.create.mockResolvedValue(mockConversation);
      mockConversationRepository.update.mockResolvedValue({ ...mockConversation, unreadCount: 1 });
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);
      mockMessageRepository.create.mockResolvedValue(mockMessage);

      await service.handleMetaWebhook({ object: 'instagram', entry: [] });

      expect(mockInstagramAdapter.parseWebhookPayload).toHaveBeenCalled();
    });

    it('should skip unsupported Meta webhook types', async () => {
      await service.handleMetaWebhook({ object: 'page', entry: [] });

      expect(mockInstagramAdapter.parseWebhookPayload).not.toHaveBeenCalled();
    });
  });

  describe('handleInstagramWebhook', () => {
    it('should process Instagram webhook directly', async () => {
      const mockEvent = {
        type: 'message' as const,
        channelConversationId: 'instagram_123_456',
        contactIdentifier: 'user123',
        message: {
          channelMessageId: 'm_DIRECT123',
          direction: 'inbound' as const,
          senderName: 'user123',
          contentType: 'text' as const,
          contentText: 'Direct Instagram message',
          timestamp: new Date(),
        },
      };

      mockInstagramAdapter.parseWebhookPayload.mockReturnValue(mockEvent);

      const mockConversation: IConversation = {
        id: 2,
        channel: 'instagram',
        channelConversationId: 'instagram_123_456',
        contactIdentifier: 'user123',
        contactName: 'user123',
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 1,
        lastMessageAt: null,
        lastMessagePreview: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessage: IMessage = {
        id: 2,
        conversationId: 2,
        channelMessageId: 'm_DIRECT123',
        direction: 'inbound',
        senderName: 'user123',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Direct Instagram message',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockConversationRepository.findByChannelConversationId.mockResolvedValue(mockConversation);
      mockConversationRepository.update.mockResolvedValue({ ...mockConversation, unreadCount: 2 });
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);
      mockMessageRepository.create.mockResolvedValue(mockMessage);

      await service.handleInstagramWebhook({
        object: 'instagram',
        entry: [{ id: 'PAGE123', time: Date.now(), messaging: [] }],
      });

      expect(mockInstagramAdapter.parseWebhookPayload).toHaveBeenCalled();
    });

    it('should skip if payload cannot be parsed', async () => {
      mockInstagramAdapter.parseWebhookPayload.mockReturnValue(null);

      await service.handleInstagramWebhook({
        object: 'instagram',
        entry: [],
      });

      expect(mockConversationRepository.findByChannelConversationId).not.toHaveBeenCalled();
    });
  });

  describe('verifyMetaWebhook', () => {
    it('should return challenge for valid token', () => {
      const result = service.verifyMetaWebhook('verify_token_123', 'challenge_abc');

      expect(result).toBe('challenge_abc');
    });

    it('should return null for invalid token', () => {
      const result = service.verifyMetaWebhook('wrong_token', 'challenge_abc');

      expect(result).toBeNull();
    });
  });

  describe('without gateway', () => {
    it('should handle message event without WebSocket gateway', async () => {
      const serviceNoGateway = new WebhookService(
        mockOptions,
        mockConversationRepository,
        mockMessageRepository,
        mockWhatsAppAdapter as unknown as WhatsAppAdapter,
        mockInstagramAdapter as unknown as InstagramAdapter,
        null,
        mockConversationService as unknown as ConversationService,
        mockMessageService as unknown as MessageService,
      );

      const mockEvent = {
        type: 'message' as const,
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        message: {
          channelMessageId: 'IM999',
          direction: 'inbound' as const,
          senderName: 'Customer',
          contentType: 'text' as const,
          contentText: 'No gateway test',
          timestamp: new Date(),
        },
      };

      mockWhatsAppAdapter.parseWebhookPayload.mockReturnValue(mockEvent);

      const mockConversation: IConversation = {
        id: 1,
        channel: 'whatsapp',
        channelConversationId: 'CH123',
        contactIdentifier: '+821012345678',
        contactName: null,
        status: 'open',
        tags: [],
        assignedUserId: null,
        unreadCount: 0,
        lastMessageAt: null,
        lastMessagePreview: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessage: IMessage = {
        id: 1,
        conversationId: 1,
        channelMessageId: 'IM999',
        direction: 'inbound',
        senderName: 'Customer',
        senderUserId: null,
        contentType: 'text',
        contentText: 'No gateway test',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockConversationRepository.findByChannelConversationId.mockResolvedValue(null);
      mockConversationRepository.create.mockResolvedValue(mockConversation);
      mockConversationRepository.update.mockResolvedValue({ ...mockConversation, unreadCount: 1 });
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);
      mockMessageRepository.create.mockResolvedValue(mockMessage);

      // Should not throw even without gateway
      await expect(serviceNoGateway.handleTwilioWebhook({})).resolves.not.toThrow();
    });
  });
});
