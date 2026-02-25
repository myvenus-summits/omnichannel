import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import type {
  ConversationFilterDto,
  AssignDto,
  UpdateTagsDto,
  UpdateStatusDto,
} from '../dto';
import type { IConversation, IConversationRepository } from '../interfaces';
import { CONVERSATION_REPOSITORY } from '../interfaces';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
  ) {}

  async findAll(filter: ConversationFilterDto) {
    return this.conversationRepository.findAll({
      channel: filter.channel,
      status: filter.status ?? 'open',
      assignedUserId: filter.assignedUserId,
      unassigned: filter.unassigned,
      tags: filter.tags,
      search: filter.search,
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
      clinicId: filter.clinicId,
      regionId: filter.regionId,
      channelConfigId: filter.channelConfigId,
      language: filter.language,
      channels: filter.channels,
      languages: filter.languages,
    });
  }

  async findOne(id: number): Promise<IConversation> {
    const conversation = await this.conversationRepository.findOne(id);

    if (!conversation) {
      throw new NotFoundException(`Conversation #${id} not found`);
    }

    return conversation;
  }

  async findByChannelConversationId(
    channelConversationId: string,
  ): Promise<IConversation | null> {
    return this.conversationRepository.findByChannelConversationId(
      channelConversationId,
    );
  }

  async create(data: Partial<IConversation>): Promise<IConversation> {
    return this.conversationRepository.create(data);
  }

  async update(
    id: number,
    data: Partial<IConversation>,
  ): Promise<IConversation> {
    const conversation = await this.findOne(id);
    return this.conversationRepository.update(id, data);
  }

  async assign(id: number, dto: AssignDto): Promise<IConversation> {
    await this.findOne(id); // Ensure exists
    return this.conversationRepository.update(id, {
      assignedUserId: dto.userId ?? null,
    });
  }

  async updateTags(id: number, dto: UpdateTagsDto): Promise<IConversation> {
    await this.findOne(id); // Ensure exists
    return this.conversationRepository.update(id, {
      tags: dto.tags,
    });
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<IConversation> {
    await this.findOne(id); // Ensure exists
    return this.conversationRepository.update(id, {
      status: dto.status,
    });
  }

  async markAsRead(id: number): Promise<IConversation> {
    await this.findOne(id); // Ensure exists
    return this.conversationRepository.update(id, {
      unreadCount: 0,
    });
  }

  async incrementUnreadCount(id: number): Promise<void> {
    await this.conversationRepository.incrementUnreadCount(id);
  }

  async updateLastMessage(
    id: number,
    preview: string,
    timestamp: Date,
  ): Promise<void> {
    await this.conversationRepository.updateLastMessage(id, preview, timestamp);
  }
}
