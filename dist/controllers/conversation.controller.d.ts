import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import { ConversationFilterDto, AssignDto, UpdateTagsDto, UpdateStatusDto, CreateMessageDto } from '../dto';
export declare class ConversationController {
    private readonly conversationService;
    private readonly messageService;
    constructor(conversationService: ConversationService, messageService: MessageService);
    findAll(filter: ConversationFilterDto): Promise<{
        items: import("..").Conversation[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<import("..").Conversation>;
    getMessages(id: number, limit?: string, before?: string): Promise<import("..").Message[]>;
    sendMessage(id: number, dto: CreateMessageDto): Promise<import("..").Message>;
    assign(id: number, dto: AssignDto): Promise<import("..").Conversation>;
    updateTags(id: number, dto: UpdateTagsDto): Promise<import("..").Conversation>;
    updateStatus(id: number, dto: UpdateStatusDto): Promise<import("..").Conversation>;
    markAsRead(id: number): Promise<import("..").Conversation>;
}
//# sourceMappingURL=conversation.controller.d.ts.map