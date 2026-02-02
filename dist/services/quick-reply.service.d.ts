import type { IQuickReply, IQuickReplyRepository } from '../interfaces';
import type { CreateQuickReplyDto, UpdateQuickReplyDto, QuickReplyQueryDto } from '../dto';
export declare class QuickReplyService {
    private readonly quickReplyRepository;
    constructor(quickReplyRepository: IQuickReplyRepository);
    /**
     * 빠른 답변 목록 조회
     * - 사용 빈도순 정렬
     * - 검색 기능 지원
     */
    findAll(query: QuickReplyQueryDto): Promise<IQuickReply[]>;
    /**
     * 빠른 답변 단일 조회
     */
    findOne(id: number): Promise<IQuickReply>;
    /**
     * 단축키로 빠른 답변 조회
     */
    findByShortcut(shortcut: string): Promise<IQuickReply | null>;
    /**
     * 빠른 답변 생성
     */
    create(dto: CreateQuickReplyDto): Promise<IQuickReply>;
    /**
     * 빠른 답변 수정
     */
    update(id: number, dto: UpdateQuickReplyDto): Promise<IQuickReply>;
    /**
     * 빠른 답변 삭제
     */
    delete(id: number): Promise<void>;
    /**
     * 사용 횟수 증가
     */
    incrementUsage(id: number): Promise<void>;
}
//# sourceMappingURL=quick-reply.service.d.ts.map