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
var ConversationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("../entities/conversation.entity");
let ConversationService = ConversationService_1 = class ConversationService {
    conversationRepository;
    logger = new common_1.Logger(ConversationService_1.name);
    constructor(conversationRepository) {
        this.conversationRepository = conversationRepository;
    }
    async findAll(filter) {
        const { channel, status = 'open', assignedUserId, unassigned, tags, search, page = 1, limit = 20, } = filter;
        const queryBuilder = this.conversationRepository.createQueryBuilder('conversation');
        if (status) {
            queryBuilder.andWhere('conversation.status = :status', { status });
        }
        if (channel) {
            queryBuilder.andWhere('conversation.channel = :channel', { channel });
        }
        if (unassigned) {
            queryBuilder.andWhere('conversation.assignedUserId IS NULL');
        }
        else if (assignedUserId) {
            queryBuilder.andWhere('conversation.assignedUserId = :assignedUserId', {
                assignedUserId,
            });
        }
        if (tags && tags.length > 0) {
            queryBuilder.andWhere('conversation.tags @> :tags', {
                tags: JSON.stringify(tags),
            });
        }
        if (search) {
            queryBuilder.andWhere('(conversation.contactName ILIKE :search OR conversation.contactIdentifier ILIKE :search)', { search: `%${search}%` });
        }
        queryBuilder.orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST');
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const conversation = await this.conversationRepository.findOne({
            where: { id },
        });
        if (!conversation) {
            throw new common_1.NotFoundException(`Conversation #${id} not found`);
        }
        return conversation;
    }
    async findByChannelConversationId(channelConversationId) {
        return this.conversationRepository.findOne({
            where: { channelConversationId },
        });
    }
    async create(data) {
        const conversation = this.conversationRepository.create(data);
        return this.conversationRepository.save(conversation);
    }
    async update(id, data) {
        const conversation = await this.findOne(id);
        Object.assign(conversation, data);
        return this.conversationRepository.save(conversation);
    }
    async assign(id, dto) {
        const conversation = await this.findOne(id);
        conversation.assignedUserId = dto.userId ?? null;
        return this.conversationRepository.save(conversation);
    }
    async updateTags(id, dto) {
        const conversation = await this.findOne(id);
        conversation.tags = dto.tags;
        return this.conversationRepository.save(conversation);
    }
    async updateStatus(id, dto) {
        const conversation = await this.findOne(id);
        conversation.status = dto.status;
        return this.conversationRepository.save(conversation);
    }
    async markAsRead(id) {
        const conversation = await this.findOne(id);
        conversation.unreadCount = 0;
        return this.conversationRepository.save(conversation);
    }
    async incrementUnreadCount(id) {
        await this.conversationRepository.increment({ id }, 'unreadCount', 1);
    }
    async updateLastMessage(id, preview, timestamp) {
        await this.conversationRepository.update(id, {
            lastMessagePreview: preview,
            lastMessageAt: timestamp,
        });
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = ConversationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.Conversation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ConversationService);
//# sourceMappingURL=conversation.service.js.map