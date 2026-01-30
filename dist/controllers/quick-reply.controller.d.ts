import { QuickReplyService } from '../services/quick-reply.service';
import { CreateQuickReplyDto, UpdateQuickReplyDto, QuickReplyQueryDto } from '../dto';
export declare class QuickReplyController {
    private readonly quickReplyService;
    constructor(quickReplyService: QuickReplyService);
    findAll(query: QuickReplyQueryDto): Promise<import("..").QuickReply[]>;
    findOne(id: number): Promise<import("..").QuickReply>;
    create(dto: CreateQuickReplyDto): Promise<import("..").QuickReply>;
    update(id: number, dto: UpdateQuickReplyDto): Promise<import("..").QuickReply>;
    delete(id: number): Promise<void>;
    incrementUsage(id: number): Promise<void>;
}
//# sourceMappingURL=quick-reply.controller.d.ts.map