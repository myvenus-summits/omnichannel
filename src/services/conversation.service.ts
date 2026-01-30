import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import type {
  ConversationFilterDto,
  AssignDto,
  UpdateTagsDto,
  UpdateStatusDto,
} from '../dto';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async findAll(filter: ConversationFilterDto) {
    const {
      channel,
      status = 'open',
      assignedUserId,
      unassigned,
      tags,
      search,
      page = 1,
      limit = 20,
    } = filter;

    const queryBuilder =
      this.conversationRepository.createQueryBuilder('conversation');

    if (status) {
      queryBuilder.andWhere('conversation.status = :status', { status });
    }

    if (channel) {
      queryBuilder.andWhere('conversation.channel = :channel', { channel });
    }

    if (unassigned) {
      queryBuilder.andWhere('conversation.assignedUserId IS NULL');
    } else if (assignedUserId) {
      queryBuilder.andWhere('conversation.assignedUserId = :assignedUserId', {
        assignedUserId,
      });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('conversation.tags @> :tags', {
        tags: JSON.stringify(tags),
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(conversation.contactName ILIKE :search OR conversation.contactIdentifier ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation #${id} not found`);
    }

    return conversation;
  }

  async findByChannelConversationId(
    channelConversationId: string,
  ): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { channelConversationId },
    });
  }

  async create(data: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.conversationRepository.create(data);
    return this.conversationRepository.save(conversation);
  }

  async update(id: number, data: Partial<Conversation>): Promise<Conversation> {
    const conversation = await this.findOne(id);
    Object.assign(conversation, data);
    return this.conversationRepository.save(conversation);
  }

  async assign(id: number, dto: AssignDto): Promise<Conversation> {
    const conversation = await this.findOne(id);
    conversation.assignedUserId = dto.userId ?? null;
    return this.conversationRepository.save(conversation);
  }

  async updateTags(id: number, dto: UpdateTagsDto): Promise<Conversation> {
    const conversation = await this.findOne(id);
    conversation.tags = dto.tags;
    return this.conversationRepository.save(conversation);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<Conversation> {
    const conversation = await this.findOne(id);
    conversation.status = dto.status;
    return this.conversationRepository.save(conversation);
  }

  async markAsRead(id: number): Promise<Conversation> {
    const conversation = await this.findOne(id);
    conversation.unreadCount = 0;
    return this.conversationRepository.save(conversation);
  }

  async incrementUnreadCount(id: number): Promise<void> {
    await this.conversationRepository.increment({ id }, 'unreadCount', 1);
  }

  async updateLastMessage(
    id: number,
    preview: string,
    timestamp: Date,
  ): Promise<void> {
    await this.conversationRepository.update(id, {
      lastMessagePreview: preview,
      lastMessageAt: timestamp,
    });
  }
}
