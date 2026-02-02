import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { IQuickReply, IQuickReplyRepository } from '../interfaces';
import { QUICK_REPLY_REPOSITORY } from '../interfaces';
import type {
  CreateQuickReplyDto,
  UpdateQuickReplyDto,
  QuickReplyQueryDto,
} from '../dto';

@Injectable()
export class QuickReplyService {
  constructor(
    @Inject(QUICK_REPLY_REPOSITORY)
    private readonly quickReplyRepository: IQuickReplyRepository,
  ) {}

  /**
   * 빠른 답변 목록 조회
   * - 사용 빈도순 정렬
   * - 검색 기능 지원
   */
  async findAll(query: QuickReplyQueryDto): Promise<IQuickReply[]> {
    return this.quickReplyRepository.findAll({
      search: query.search,
      activeOnly: query.activeOnly !== false,
    });
  }

  /**
   * 빠른 답변 단일 조회
   */
  async findOne(id: number): Promise<IQuickReply> {
    const quickReply = await this.quickReplyRepository.findOne(id);

    if (!quickReply) {
      throw new NotFoundException(`Quick reply #${id} not found`);
    }

    return quickReply;
  }

  /**
   * 단축키로 빠른 답변 조회
   */
  async findByShortcut(shortcut: string): Promise<IQuickReply | null> {
    return this.quickReplyRepository.findByShortcut(shortcut);
  }

  /**
   * 빠른 답변 생성
   */
  async create(dto: CreateQuickReplyDto): Promise<IQuickReply> {
    return this.quickReplyRepository.create({
      title: dto.title,
      content: dto.content,
      shortcut: dto.shortcut ?? null,
      usageCount: 0,
      isActive: true,
    });
  }

  /**
   * 빠른 답변 수정
   */
  async update(id: number, dto: UpdateQuickReplyDto): Promise<IQuickReply> {
    await this.findOne(id); // Ensure exists
    return this.quickReplyRepository.update(id, dto);
  }

  /**
   * 빠른 답변 삭제
   */
  async delete(id: number): Promise<void> {
    await this.findOne(id); // Ensure exists
    await this.quickReplyRepository.delete(id);
  }

  /**
   * 사용 횟수 증가
   */
  async incrementUsage(id: number): Promise<void> {
    await this.quickReplyRepository.incrementUsage(id);
  }
}
