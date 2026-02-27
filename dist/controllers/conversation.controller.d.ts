import { ConversationService } from '../services/conversation.service';
import { MessageService } from '../services/message.service';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import { ConversationFilterDto, AssignDto, UpdateTagsDto, UpdateStatusDto, CreateMessageDto } from '../dto';
export declare class ConversationController {
    private readonly conversationService;
    private readonly messageService;
    private readonly omnichannelGateway;
    private readonly logger;
    constructor(conversationService: ConversationService, messageService: MessageService, omnichannelGateway: OmnichannelGateway);
    findAll(filter: ConversationFilterDto): Promise<import("..").PaginatedResult<import("..").IConversation>>;
    findOne(id: number): Promise<import("..").IConversation>;
    getMessages(id: number, limit?: string, before?: string): Promise<import("..").IMessage[]>;
    sendMessage(id: number, dto: CreateMessageDto, req: any): Promise<import("..").IMessage>;
    resendMessage(id: number, messageId: number): Promise<import("..").IMessage>;
    assign(id: number, dto: AssignDto): Promise<import("..").IConversation>;
    updateTags(id: number, dto: UpdateTagsDto): Promise<import("..").IConversation>;
    updateStatus(id: number, dto: UpdateStatusDto): Promise<import("..").IConversation>;
    markAsRead(id: number): Promise<import("..").IConversation>;
}
//# sourceMappingURL=conversation.controller.d.ts.map