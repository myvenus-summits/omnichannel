/**
 * QuickReply 인터페이스
 * 빠른 답변 템플릿
 */
export interface IQuickReply {
    id: number;
    title: string;
    content: string;
    shortcut: string | null;
    usageCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * QuickReply 생성용 데이터
 */
export type CreateQuickReplyData = Omit<IQuickReply, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: number;
    createdAt?: Date;
    updatedAt?: Date;
};
/**
 * QuickReply 업데이트용 데이터
 */
export type UpdateQuickReplyData = Partial<Omit<IQuickReply, 'id' | 'createdAt'>>;
//# sourceMappingURL=quick-reply.interface.d.ts.map