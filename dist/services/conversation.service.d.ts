import type { ConversationFilterDto, AssignDto, UpdateTagsDto, UpdateStatusDto } from '../dto';
import type { IConversation, IConversationRepository } from '../interfaces';
export declare class ConversationService {
    private readonly conversationRepository;
    private readonly logger;
    constructor(conversationRepository: IConversationRepository);
    findAll(filter: ConversationFilterDto): Promise<import("../interfaces").PaginatedResult<IConversation>>;
    findOne(id: number): Promise<IConversation>;
    findByChannelConversationId(channelConversationId: string): Promise<IConversation | null>;
    create(data: Partial<IConversation>): Promise<IConversation>;
    update(id: number, data: Partial<IConversation>): Promise<IConversation>;
    assign(id: number, dto: AssignDto): Promise<IConversation>;
    updateTags(id: number, dto: UpdateTagsDto): Promise<IConversation>;
    updateStatus(id: number, dto: UpdateStatusDto): Promise<IConversation>;
    markAsRead(id: number): Promise<IConversation>;
    incrementUnreadCount(id: number): Promise<void>;
    updateLastMessage(id: number, preview: string, timestamp: Date): Promise<void>;
}
//# sourceMappingURL=conversation.service.d.ts.map