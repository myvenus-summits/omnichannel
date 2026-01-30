import { Repository } from 'typeorm';
import { QuickReply } from '../entities';
import type { CreateQuickReplyDto, UpdateQuickReplyDto, QuickReplyQueryDto } from '../dto';
export declare class QuickReplyService {
    private readonly quickReplyRepository;
    constructor(quickReplyRepository: Repository<QuickReply>);
    /**
     * 빠른 답변 목록 조회
     * - 사용 빈도순 정렬
     * - 검색 기능 지원
     */
    findAll(query: QuickReplyQueryDto): Promise<QuickReply[]>;
    /**
     * 빠른 답변 단일 조회
     */
    findOne(id: number): Promise<QuickReply>;
    /**
     * 단축키로 빠른 답변 조회
     */
    findByShortcut(shortcut: string): Promise<QuickReply | null>;
    /**
     * 빠른 답변 생성
     */
    create(dto: CreateQuickReplyDto): Promise<QuickReply>;
    /**
     * 빠른 답변 수정
     */
    update(id: number, dto: UpdateQuickReplyDto): Promise<QuickReply>;
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