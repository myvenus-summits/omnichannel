"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickReplyService = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("../interfaces");
let QuickReplyService = class QuickReplyService {
    quickReplyRepository;
    constructor(quickReplyRepository) {
        this.quickReplyRepository = quickReplyRepository;
    }
    /**
     * 빠른 답변 목록 조회
     * - 사용 빈도순 정렬
     * - 검색 기능 지원
     */
    async findAll(query) {
        return this.quickReplyRepository.findAll({
            search: query.search,
            activeOnly: query.activeOnly !== false,
        });
    }
    /**
     * 빠른 답변 단일 조회
     */
    async findOne(id) {
        const quickReply = await this.quickReplyRepository.findOne(id);
        if (!quickReply) {
            throw new common_1.NotFoundException(`Quick reply #${id} not found`);
        }
        return quickReply;
    }
    /**
     * 단축키로 빠른 답변 조회
     */
    async findByShortcut(shortcut) {
        return this.quickReplyRepository.findByShortcut(shortcut);
    }
    /**
     * 빠른 답변 생성
     */
    async create(dto) {
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
    async update(id, dto) {
        await this.findOne(id); // Ensure exists
        return this.quickReplyRepository.update(id, dto);
    }
    /**
     * 빠른 답변 삭제
     */
    async delete(id) {
        await this.findOne(id); // Ensure exists
        await this.quickReplyRepository.delete(id);
    }
    /**
     * 사용 횟수 증가
     */
    async incrementUsage(id) {
        await this.quickReplyRepository.incrementUsage(id);
    }
};
exports.QuickReplyService = QuickReplyService;
exports.QuickReplyService = QuickReplyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(interfaces_1.QUICK_REPLY_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], QuickReplyService);
//# sourceMappingURL=quick-reply.service.js.map