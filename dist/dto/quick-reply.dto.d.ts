export declare class CreateQuickReplyDto {
    title: string;
    content: string;
    shortcut?: string;
}
declare const UpdateQuickReplyDto_base: import("@nestjs/common").Type<Partial<CreateQuickReplyDto>>;
export declare class UpdateQuickReplyDto extends UpdateQuickReplyDto_base {
    isActive?: boolean;
}
export declare class QuickReplyQueryDto {
    search?: string;
    activeOnly?: boolean;
}
export {};
//# sourceMappingURL=quick-reply.dto.d.ts.map