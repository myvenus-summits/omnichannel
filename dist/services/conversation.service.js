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
const interfaces_1 = require("../interfaces");
let ConversationService = ConversationService_1 = class ConversationService {
    conversationRepository;
    logger = new common_1.Logger(ConversationService_1.name);
    constructor(conversationRepository) {
        this.conversationRepository = conversationRepository;
    }
    async findAll(filter) {
        return this.conversationRepository.findAll({
            channel: filter.channel,
            status: filter.status ?? 'open',
            assignedUserId: filter.assignedUserId,
            unassigned: filter.unassigned,
            tags: filter.tags,
            search: filter.search,
            page: filter.page ?? 1,
            limit: filter.limit ?? 20,
            clinicId: filter.clinicId,
            regionId: filter.regionId,
            channelConfigId: filter.channelConfigId,
            language: filter.language,
            channels: filter.channels,
            languages: filter.languages,
        });
    }
    async findOne(id) {
        const conversation = await this.conversationRepository.findOne(id);
        if (!conversation) {
            throw new common_1.NotFoundException(`Conversation #${id} not found`);
        }
        return conversation;
    }
    async findByChannelConversationId(channelConversationId) {
        return this.conversationRepository.findByChannelConversationId(channelConversationId);
    }
    async create(data) {
        return this.conversationRepository.create(data);
    }
    async update(id, data) {
        const conversation = await this.findOne(id);
        return this.conversationRepository.update(id, data);
    }
    async assign(id, dto) {
        await this.findOne(id); // Ensure exists
        return this.conversationRepository.update(id, {
            assignedUserId: dto.userId ?? null,
        });
    }
    async updateTags(id, dto) {
        await this.findOne(id); // Ensure exists
        return this.conversationRepository.update(id, {
            tags: dto.tags,
        });
    }
    async updateStatus(id, dto) {
        await this.findOne(id); // Ensure exists
        return this.conversationRepository.update(id, {
            status: dto.status,
        });
    }
    async markAsRead(id) {
        await this.findOne(id); // Ensure exists
        return this.conversationRepository.update(id, {
            unreadCount: 0,
        });
    }
    async incrementUnreadCount(id) {
        await this.conversationRepository.incrementUnreadCount(id);
    }
    async updateLastMessage(id, preview, timestamp) {
        await this.conversationRepository.updateLastMessage(id, preview, timestamp);
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = ConversationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(interfaces_1.CONVERSATION_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ConversationService);
//# sourceMappingURL=conversation.service.js.map