import { MessageService } from './message.service';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { ConversationService } from './conversation.service';
import { NotFoundException } from '@nestjs/common';
import type { Repository, SelectQueryBuilder } from 'typeorm';
import type { Message } from '../entities/message.entity';
import type { Conversation } from '../entities/conversation.entity';

// Mock query builder
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

// Mock Message repository
const mockMessageRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

// Mock Conversation repository
const mockConversationRepository = {};

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
      mockMessageRepository as unknown as Repository<Message>,
      mockConversationRepository as unknown as Repository<Conversation>,
      mockWhatsAppAdapter as unknown as WhatsAppAdapter,
      mockConversationService as unknown as ConversationService,
    );
  });

  describe('findByConversation', () => {
    it('should return messages for a conversation', async () => {
      const mockMessages = [
        { id: 1, contentText: 'First', createdAt: new Date('2024-01-30T10:00:00Z') },
        { id: 2, contentText: 'Second', createdAt: new Date('2024-01-30T10:01:00Z') },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockMessages);

      const result = await service.findByConversation(1, { limit: 50 });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'message.conversationId = :conversationId',
        { conversationId: 1 },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('message.createdAt', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockMessages.reverse());
    });

    it('should apply before cursor if provided', async () => {
      const beforeMessage = {
        id: 5,
        createdAt: new Date('2024-01-30T10:05:00Z'),
      };

      mockMessageRepository.findOne.mockResolvedValue(beforeMessage);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findByConversation(1, { before: '5' });

      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'message.createdAt < :beforeDate',
        { beforeDate: beforeMessage.createdAt },
      );
    });

    it('should use default limit of 50', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findByConversation(1);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });
  });

  describe('findOne', () => {
    it('should return a message by id', async () => {
      const mockMessage = {
        id: 1,
        contentText: 'Hello',
        conversation: { id: 1 },
      };

      mockMessageRepository.findOne.mockResolvedValue(mockMessage);

      const result = await service.findOne(1);

      expect(result).toEqual(mockMessage);
      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['conversation'],
      });
    });

    it('should throw NotFoundException if message not found', async () => {
      mockMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Message #999 not found');
    });
  });

  describe('create', () => {
    it('should create and save a message', async () => {
      const messageData = {
        conversationId: 1,
        channelMessageId: 'MSG123',
        direction: 'inbound' as const,
        contentType: 'text' as const,
        contentText: 'Hello',
      };

      const createdMessage = { id: 1, ...messageData };

      mockMessageRepository.create.mockReturnValue(createdMessage);
      mockMessageRepository.save.mockResolvedValue(createdMessage);

      const result = await service.create(messageData);

      expect(mockMessageRepository.create).toHaveBeenCalledWith(messageData);
      expect(mockMessageRepository.save).toHaveBeenCalledWith(createdMessage);
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

      const savedMessage = {
        id: 1,
        channelMessageId: 'SM123456',
        direction: 'outbound',
        contentType: 'text',
        contentText: 'Hello customer',
      };

      mockMessageRepository.create.mockReturnValue(savedMessage);
      mockMessageRepository.save.mockResolvedValue(savedMessage);

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

      const savedMessage = {
        id: 2,
        channelMessageId: 'SM_IMG123',
        direction: 'outbound',
        contentType: 'image',
        contentMediaUrl: 'https://example.com/image.jpg',
      };

      mockMessageRepository.create.mockReturnValue(savedMessage);
      mockMessageRepository.save.mockResolvedValue(savedMessage);

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

      const savedMessage = {
        id: 3,
        channelMessageId: 'SM_TPL123',
        direction: 'outbound',
        contentType: 'template',
      };

      mockMessageRepository.create.mockReturnValue(savedMessage);
      mockMessageRepository.save.mockResolvedValue(savedMessage);

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

      const savedMessage = {
        id: 4,
        channelMessageId: 'SM_USER123',
        senderUserId: 42,
      };

      mockMessageRepository.create.mockReturnValue(savedMessage);
      mockMessageRepository.save.mockResolvedValue(savedMessage);

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

      const savedMessage = {
        id: 5,
        channelMessageId: 'SM_MEDIA123',
        contentType: 'file',
        contentMediaUrl: 'https://example.com/doc.pdf',
      };

      mockMessageRepository.create.mockReturnValue(savedMessage);
      mockMessageRepository.save.mockResolvedValue(savedMessage);

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
      mockMessageRepository.findOne.mockResolvedValue(null);

      const createdMessage = { id: 1, ...webhookData };
      mockMessageRepository.create.mockReturnValue(createdMessage);
      mockMessageRepository.save.mockResolvedValue(createdMessage);

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
      const existingMessage = { id: 99, channelMessageId: 'WH_MSG123' };
      mockMessageRepository.findOne.mockResolvedValue(existingMessage);

      const result = await service.createFromWebhook(1, webhookData);

      expect(result).toEqual(existingMessage);
      expect(mockMessageRepository.create).not.toHaveBeenCalled();
    });

    it('should not increment unread for outbound messages', async () => {
      mockMessageRepository.findOne.mockResolvedValue(null);

      const outboundData = { ...webhookData, direction: 'outbound' as const };
      const createdMessage = { id: 2, ...outboundData };

      mockMessageRepository.create.mockReturnValue(createdMessage);
      mockMessageRepository.save.mockResolvedValue(createdMessage);

      await service.createFromWebhook(1, outboundData);

      expect(mockConversationService.incrementUnreadCount).not.toHaveBeenCalled();
    });

    it('should use media placeholder for messages without text', async () => {
      mockMessageRepository.findOne.mockResolvedValue(null);

      const mediaData = {
        ...webhookData,
        contentType: 'image',
        contentText: undefined,
        contentMediaUrl: 'https://example.com/image.jpg',
      };
      const createdMessage = { id: 3, ...mediaData };

      mockMessageRepository.create.mockReturnValue(createdMessage);
      mockMessageRepository.save.mockResolvedValue(createdMessage);

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

      expect(mockMessageRepository.update).toHaveBeenCalledWith(
        { channelMessageId: 'MSG123' },
        { status: 'delivered' },
      );
    });

    it('should handle read status', async () => {
      await service.updateStatus('MSG456', 'read');

      expect(mockMessageRepository.update).toHaveBeenCalledWith(
        { channelMessageId: 'MSG456' },
        { status: 'read' },
      );
    });

    it('should handle sent status', async () => {
      await service.updateStatus('MSG789', 'sent');

      expect(mockMessageRepository.update).toHaveBeenCalledWith(
        { channelMessageId: 'MSG789' },
        { status: 'sent' },
      );
    });
  });
});
