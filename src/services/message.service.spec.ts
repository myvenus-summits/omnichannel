import { MessageService } from './message.service';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { ConversationService } from './conversation.service';
import { NotFoundException } from '@nestjs/common';
import type { IMessageRepository, IMessage } from '../interfaces';

// Mock Message repository (implementing IMessageRepository interface)
const mockMessageRepository: jest.Mocked<IMessageRepository> = {
  findByConversation: jest.fn(),
  findOne: jest.fn(),
  findByChannelMessageId: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};

// Mock WhatsApp adapter
const mockWhatsAppAdapter = {
  sendMessage: jest.fn(),
  sendTemplateMessage: jest.fn(),
};

// Mock Conversation service
const mockConversationService = {
  findOne: jest.fn(),
  updateLastMessage: jest.fn(),
  incrementUnreadCount: jest.fn(),
};

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessageService(
      mockMessageRepository,
      mockWhatsAppAdapter as unknown as WhatsAppAdapter,
      mockConversationService as unknown as ConversationService,
    );
  });

  describe('findByConversation', () => {
    it('should return messages for a conversation', async () => {
      const mockMessages: IMessage[] = [
        {
          id: 1,
          conversationId: 1,
          channelMessageId: 'MSG1',
          direction: 'inbound',
          senderName: null,
          senderUserId: null,
          contentType: 'text',
          contentText: 'First',
          contentMediaUrl: null,
          status: 'delivered',
          metadata: null,
          createdAt: new Date('2024-01-30T10:00:00Z'),
        },
        {
          id: 2,
          conversationId: 1,
          channelMessageId: 'MSG2',
          direction: 'inbound',
          senderName: null,
          senderUserId: null,
          contentType: 'text',
          contentText: 'Second',
          contentMediaUrl: null,
          status: 'delivered',
          metadata: null,
          createdAt: new Date('2024-01-30T10:01:00Z'),
        },
      ];

      mockMessageRepository.findByConversation.mockResolvedValue(mockMessages);

      const result = await service.findByConversation(1, { limit: 50 });

      expect(mockMessageRepository.findByConversation).toHaveBeenCalledWith(1, { limit: 50 });
      expect(result).toEqual(mockMessages);
    });

    it('should apply before cursor if provided', async () => {
      mockMessageRepository.findByConversation.mockResolvedValue([]);

      await service.findByConversation(1, { before: '5' });

      expect(mockMessageRepository.findByConversation).toHaveBeenCalledWith(1, { before: '5' });
    });

    it('should use default options when not provided', async () => {
      mockMessageRepository.findByConversation.mockResolvedValue([]);

      await service.findByConversation(1);

      expect(mockMessageRepository.findByConversation).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('findOne', () => {
    it('should return a message by id', async () => {
      const mockMessage: IMessage = {
        id: 1,
        conversationId: 1,
        channelMessageId: 'MSG1',
        direction: 'inbound',
        senderName: null,
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hello',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.findOne.mockResolvedValue(mockMessage);

      const result = await service.findOne(1);

      expect(result).toEqual(mockMessage);
      expect(mockMessageRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if message not found', async () => {
      mockMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Message #999 not found');
    });
  });

  describe('create', () => {
    it('should create and save a message', async () => {
      const messageData: Partial<IMessage> = {
        conversationId: 1,
        channelMessageId: 'MSG123',
        direction: 'inbound',
        contentType: 'text',
        contentText: 'Hello',
      };

      const createdMessage: IMessage = {
        id: 1,
        conversationId: 1,
        channelMessageId: 'MSG123',
        direction: 'inbound',
        senderName: null,
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hello',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(createdMessage);

      const result = await service.create(messageData);

      expect(mockMessageRepository.create).toHaveBeenCalledWith(messageData);
      expect(result).toEqual(createdMessage);
    });
  });

  describe('sendMessage', () => {
    const mockConversation = {
      id: 1,
      contactIdentifier: '+821012345678',
      channel: 'whatsapp' as const,
    };

    beforeEach(() => {
      mockConversationService.findOne.mockResolvedValue(mockConversation);
    });

    it('should send a text message successfully', async () => {
      mockWhatsAppAdapter.sendMessage.mockResolvedValue({
        success: true,
        channelMessageId: 'SM123456',
      });

      const savedMessage: IMessage = {
        id: 1,
        conversationId: 1,
        channelMessageId: 'SM123456',
        direction: 'outbound',
        senderName: null,
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hello customer',
        contentMediaUrl: null,
        status: 'sent',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(savedMessage);

      const result = await service.sendMessage(1, {
        contentType: 'text',
        contentText: 'Hello customer',
      });

      expect(mockWhatsAppAdapter.sendMessage).toHaveBeenCalledWith(
        '+821012345678',
        { type: 'text', text: 'Hello customer', mediaUrl: undefined },
      );
      expect(result).toEqual(savedMessage);
      expect(mockConversationService.updateLastMessage).toHaveBeenCalled();
    });

    it('should send an image message', async () => {
      mockWhatsAppAdapter.sendMessage.mockResolvedValue({
        success: true,
        channelMessageId: 'SM_IMG123',
      });

      const savedMessage: IMessage = {
        id: 2,
        conversationId: 1,
        channelMessageId: 'SM_IMG123',
        direction: 'outbound',
        senderName: null,
        senderUserId: null,
        contentType: 'image',
        contentText: null,
        contentMediaUrl: 'https://example.com/image.jpg',
        status: 'sent',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(savedMessage);

      await service.sendMessage(1, {
        contentType: 'image',
        contentMediaUrl: 'https://example.com/image.jpg',
      });

      expect(mockWhatsAppAdapter.sendMessage).toHaveBeenCalledWith(
        '+821012345678',
        {
          type: 'image',
          text: undefined,
          mediaUrl: 'https://example.com/image.jpg',
        },
      );
    });

    it('should send a template message', async () => {
      mockWhatsAppAdapter.sendTemplateMessage.mockResolvedValue({
        success: true,
        channelMessageId: 'SM_TPL123',
      });

      const savedMessage: IMessage = {
        id: 3,
        conversationId: 1,
        channelMessageId: 'SM_TPL123',
        direction: 'outbound',
        senderName: null,
        senderUserId: null,
        contentType: 'template',
        contentText: null,
        contentMediaUrl: null,
        status: 'sent',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(savedMessage);

      await service.sendMessage(1, {
        contentType: 'template',
        templateId: 'HX_WELCOME',
        templateVariables: { name: 'John' },
      });

      expect(mockWhatsAppAdapter.sendTemplateMessage).toHaveBeenCalledWith(
        '+821012345678',
        'HX_WELCOME',
        { name: 'John' },
      );
    });

    it('should throw error when message send fails', async () => {
      mockWhatsAppAdapter.sendMessage.mockResolvedValue({
        success: false,
        error: 'Invalid recipient',
      });

      await expect(
        service.sendMessage(1, {
          contentType: 'text',
          contentText: 'Hello',
        }),
      ).rejects.toThrow('Failed to send message: Invalid recipient');
    });

    it('should include sender user id when provided', async () => {
      mockWhatsAppAdapter.sendMessage.mockResolvedValue({
        success: true,
        channelMessageId: 'SM_USER123',
      });

      const savedMessage: IMessage = {
        id: 4,
        conversationId: 1,
        channelMessageId: 'SM_USER123',
        direction: 'outbound',
        senderName: null,
        senderUserId: 42,
        contentType: 'text',
        contentText: 'From agent',
        contentMediaUrl: null,
        status: 'sent',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(savedMessage);

      await service.sendMessage(
        1,
        { contentType: 'text', contentText: 'From agent' },
        42,
      );

      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderUserId: 42,
        }),
      );
    });

    it('should update last message preview with media placeholder', async () => {
      mockWhatsAppAdapter.sendMessage.mockResolvedValue({
        success: true,
        channelMessageId: 'SM_MEDIA123',
      });

      const savedMessage: IMessage = {
        id: 5,
        conversationId: 1,
        channelMessageId: 'SM_MEDIA123',
        direction: 'outbound',
        senderName: null,
        senderUserId: null,
        contentType: 'file',
        contentText: null,
        contentMediaUrl: 'https://example.com/doc.pdf',
        status: 'sent',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(savedMessage);

      await service.sendMessage(1, {
        contentType: 'file',
        contentMediaUrl: 'https://example.com/doc.pdf',
      });

      expect(mockConversationService.updateLastMessage).toHaveBeenCalledWith(
        1,
        '[Media]',
        expect.any(Date),
      );
    });
  });

  describe('createFromWebhook', () => {
    const webhookData = {
      channelMessageId: 'WH_MSG123',
      direction: 'inbound' as const,
      senderName: 'Customer',
      contentType: 'text',
      contentText: 'Hello from webhook',
      timestamp: new Date('2024-01-30T10:00:00Z'),
      metadata: { source: 'whatsapp' },
    };

    it('should create a message from webhook data', async () => {
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);

      const createdMessage: IMessage = {
        id: 1,
        conversationId: 1,
        channelMessageId: 'WH_MSG123',
        direction: 'inbound',
        senderName: 'Customer',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hello from webhook',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: { source: 'whatsapp' },
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(createdMessage);

      const result = await service.createFromWebhook(1, webhookData);

      expect(result).toEqual(createdMessage);
      expect(mockConversationService.incrementUnreadCount).toHaveBeenCalledWith(1);
      expect(mockConversationService.updateLastMessage).toHaveBeenCalledWith(
        1,
        'Hello from webhook',
        webhookData.timestamp,
      );
    });

    it('should return existing message if already exists', async () => {
      const existingMessage: IMessage = {
        id: 99,
        conversationId: 1,
        channelMessageId: 'WH_MSG123',
        direction: 'inbound',
        senderName: 'Customer',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hello from webhook',
        contentMediaUrl: null,
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.findByChannelMessageId.mockResolvedValue(existingMessage);

      const result = await service.createFromWebhook(1, webhookData);

      expect(result).toEqual(existingMessage);
      expect(mockMessageRepository.create).not.toHaveBeenCalled();
    });

    it('should not increment unread for outbound messages', async () => {
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);

      const outboundData = { ...webhookData, direction: 'outbound' as const };
      const createdMessage: IMessage = {
        id: 2,
        conversationId: 1,
        channelMessageId: 'WH_MSG123',
        direction: 'outbound',
        senderName: 'Agent',
        senderUserId: null,
        contentType: 'text',
        contentText: 'Hello from webhook',
        contentMediaUrl: null,
        status: 'sent',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(createdMessage);

      await service.createFromWebhook(1, outboundData);

      expect(mockConversationService.incrementUnreadCount).not.toHaveBeenCalled();
    });

    it('should use media placeholder for messages without text', async () => {
      mockMessageRepository.findByChannelMessageId.mockResolvedValue(null);

      const mediaData = {
        ...webhookData,
        contentType: 'image',
        contentText: undefined,
        contentMediaUrl: 'https://example.com/image.jpg',
      };
      const createdMessage: IMessage = {
        id: 3,
        conversationId: 1,
        channelMessageId: 'WH_MSG123',
        direction: 'inbound',
        senderName: 'Customer',
        senderUserId: null,
        contentType: 'image',
        contentText: null,
        contentMediaUrl: 'https://example.com/image.jpg',
        status: 'delivered',
        metadata: null,
        createdAt: new Date(),
      };

      mockMessageRepository.create.mockResolvedValue(createdMessage);

      await service.createFromWebhook(1, mediaData);

      expect(mockConversationService.updateLastMessage).toHaveBeenCalledWith(
        1,
        '[Media]',
        webhookData.timestamp,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update message status', async () => {
      await service.updateStatus('MSG123', 'delivered');

      expect(mockMessageRepository.updateStatus).toHaveBeenCalledWith('MSG123', 'delivered');
    });

    it('should handle read status', async () => {
      await service.updateStatus('MSG456', 'read');

      expect(mockMessageRepository.updateStatus).toHaveBeenCalledWith('MSG456', 'read');
    });

    it('should handle sent status', async () => {
      await service.updateStatus('MSG789', 'sent');

      expect(mockMessageRepository.updateStatus).toHaveBeenCalledWith('MSG789', 'sent');
    });
  });
});
