import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import type { CreateMessageDto } from '../dto';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { ConversationService } from './conversation.service';
import type { MessageDirection, MessageStatus, SendMessageResult } from '../types';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly whatsappAdapter: WhatsAppAdapter,
    private readonly conversationService: ConversationService,
  ) {}

  async findByConversation(
    conversationId: number,
    options?: { limit?: number; before?: string },
  ) {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC');

    if (options?.before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: Number(options.before) },
      });
      if (beforeMessage) {
        queryBuilder.andWhere('message.createdAt < :beforeDate', {
          beforeDate: beforeMessage.createdAt,
        });
      }
    }

    if (options?.limit) {
      queryBuilder.take(options.limit);
    } else {
      queryBuilder.take(50);
    }

    const messages = await queryBuilder.getMany();

    return messages.reverse();
  }

  async findOne(id: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException(`Message #${id} not found`);
    }

    return message;
  }

  async create(data: Partial<Message>): Promise<Message> {
    const message = this.messageRepository.create(data);
    return this.messageRepository.save(message);
  }

  async sendMessage(
    conversationId: number,
    dto: CreateMessageDto,
    senderUserId?: number,
  ): Promise<Message> {
    const conversation = await this.conversationService.findOne(conversationId);

    let result: SendMessageResult;
    if (dto.contentType === 'template' && dto.templateId) {
      result = await this.whatsappAdapter.sendTemplateMessage(
        conversation.contactIdentifier,
        dto.templateId,
        dto.templateVariables ?? {},
      );
    } else {
      const messageType =
        dto.contentType === 'text'
          ? 'text'
          : dto.contentType === 'image'
            ? 'image'
            : 'file';
      result = await this.whatsappAdapter.sendMessage(
        conversation.contactIdentifier,
        {
          type: messageType,
          text: dto.contentText,
          mediaUrl: dto.contentMediaUrl,
        },
      );
    }

    if (!result.success) {
      throw new Error(`Failed to send message: ${result.error}`);
    }

    const message = await this.create({
      conversationId,
      channelMessageId: result.channelMessageId ?? `local-${Date.now()}`,
      direction: 'outbound',
      senderUserId,
      contentType: dto.contentType,
      contentText: dto.contentText,
      contentMediaUrl: dto.contentMediaUrl,
      status: 'sent',
    });

    await this.conversationService.updateLastMessage(
      conversationId,
      dto.contentText?.substring(0, 100) ?? '[Media]',
      new Date(),
    );

    return message;
  }

  async createFromWebhook(
    conversationId: number,
    data: {
      channelMessageId: string;
      direction: MessageDirection;
      senderName?: string;
      contentType: string;
      contentText?: string;
      contentMediaUrl?: string;
      timestamp: Date;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Message> {
    const existing = await this.messageRepository.findOne({
      where: { channelMessageId: data.channelMessageId },
    });

    if (existing) {
      this.logger.log(`Message ${data.channelMessageId} already exists`);
      return existing;
    }

    const message = await this.create({
      conversationId,
      channelMessageId: data.channelMessageId,
      direction: data.direction,
      senderName: data.senderName,
      contentType: data.contentType as Message['contentType'],
      contentText: data.contentText,
      contentMediaUrl: data.contentMediaUrl,
      status: 'delivered',
      metadata: data.metadata,
    });

    if (data.direction === 'inbound') {
      await this.conversationService.incrementUnreadCount(conversationId);
    }

    await this.conversationService.updateLastMessage(
      conversationId,
      data.contentText?.substring(0, 100) ?? '[Media]',
      data.timestamp,
    );

    return message;
  }

  async updateStatus(
    channelMessageId: string,
    status: MessageStatus,
  ): Promise<void> {
    await this.messageRepository.update({ channelMessageId }, { status });
  }
}
