import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuickReply } from '../entities';
import type {
  CreateQuickReplyDto,
  UpdateQuickReplyDto,
  QuickReplyQueryDto,
} from '../dto';

@Injectable()
export class QuickReplyService {
  constructor(
    @InjectRepository(QuickReply)
    private readonly quickReplyRepository: Repository<QuickReply>,
  ) {}

  /**
   * 빠른 답변 목록 조회
   * - 사용 빈도순 정렬
   * - 검색 기능 지원
   */
  async findAll(query: QuickReplyQueryDto): Promise<QuickReply[]> {
    const qb = this.quickReplyRepository.createQueryBuilder('qr');

    if (query.activeOnly !== false) {
      qb.where('qr.isActive = :isActive', { isActive: true });
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      qb.andWhere(
        '(qr.title ILIKE :search OR qr.content ILIKE :search OR qr.shortcut ILIKE :search)',
        { search: searchTerm },
      );
    }

    qb.orderBy('qr.usageCount', 'DESC').addOrderBy('qr.createdAt', 'DESC');

    return qb.getMany();
  }

  /**
   * 빠른 답변 단일 조회
   */
  async findOne(id: number): Promise<QuickReply> {
    const quickReply = await this.quickReplyRepository.findOne({
      where: { id },
    });

    if (!quickReply) {
      throw new NotFoundException(`Quick reply #${id} not found`);
    }

    return quickReply;
  }

  /**
   * 단축키로 빠른 답변 조회
   */
  async findByShortcut(shortcut: string): Promise<QuickReply | null> {
    return this.quickReplyRepository.findOne({
      where: { shortcut, isActive: true },
    });
  }

  /**
   * 빠른 답변 생성
   */
  async create(dto: CreateQuickReplyDto): Promise<QuickReply> {
    const quickReply = this.quickReplyRepository.create(dto);
    return this.quickReplyRepository.save(quickReply);
  }

  /**
   * 빠른 답변 수정
   */
  async update(id: number, dto: UpdateQuickReplyDto): Promise<QuickReply> {
    const quickReply = await this.findOne(id);

    Object.assign(quickReply, dto);
    return this.quickReplyRepository.save(quickReply);
  }

  /**
   * 빠른 답변 삭제
   */
  async delete(id: number): Promise<void> {
    const quickReply = await this.findOne(id);
    await this.quickReplyRepository.remove(quickReply);
  }

  /**
   * 사용 횟수 증가
   */
  async incrementUsage(id: number): Promise<void> {
    await this.quickReplyRepository.increment({ id }, 'usageCount', 1);
  }
}
