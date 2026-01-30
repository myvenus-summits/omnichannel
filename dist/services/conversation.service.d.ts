import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import type { ConversationFilterDto, AssignDto, UpdateTagsDto, UpdateStatusDto } from '../dto';
export declare class ConversationService {
    private readonly conversationRepository;
    private readonly logger;
    constructor(conversationRepository: Repository<Conversation>);
    findAll(filter: ConversationFilterDto): Promise<{
        items: Conversation[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Conversation>;
    findByChannelConversationId(channelConversationId: string): Promise<Conversation | null>;
    create(data: Partial<Conversation>): Promise<Conversation>;
    update(id: number, data: Partial<Conversation>): Promise<Conversation>;
    assign(id: number, dto: AssignDto): Promise<Conversation>;
    updateTags(id: number, dto: UpdateTagsDto): Promise<Conversation>;
    updateStatus(id: number, dto: UpdateStatusDto): Promise<Conversation>;
    markAsRead(id: number): Promise<Conversation>;
    incrementUnreadCount(id: number): Promise<void>;
    updateLastMessage(id: number, preview: string, timestamp: Date): Promise<void>;
}
//# sourceMappingURL=conversation.service.d.ts.map