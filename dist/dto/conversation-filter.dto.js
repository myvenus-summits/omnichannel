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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStatusDto = exports.UpdateTagsDto = exports.AssignDto = exports.ConversationFilterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ConversationFilterDto {
    channel;
    status;
    assignedUserId;
    unassigned;
    tags;
    search;
    clinicId;
    customFilters;
    channelConfigId;
    language;
    channels;
    languages;
    reservationBadge;
    page = 1;
    limit = 20;
}
exports.ConversationFilterDto = ConversationFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '채널 필터',
        enum: ['whatsapp', 'instagram', 'line'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['whatsapp', 'instagram', 'line']),
    __metadata("design:type", String)
], ConversationFilterDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상태 필터',
        enum: ['open', 'closed', 'snoozed'],
        default: 'open',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['open', 'closed', 'snoozed']),
    __metadata("design:type", String)
], ConversationFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '담당자 ID 필터',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ConversationFilterDto.prototype, "assignedUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '배정되지 않은 대화만 조회',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], ConversationFilterDto.prototype, "unassigned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '태그 필터 (복수 가능)',
        type: [String],
        example: ['urgent', 'vip'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.split(',') : value),
    __metadata("design:type", Array)
], ConversationFilterDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '검색어 (고객명, 전화번호)',
        example: '홍길동',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '병원 ID 필터 (멀티테넌트)',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ConversationFilterDto.prototype, "clinicId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트별 커스텀 필터 (JSON string)',
        example: '{"regionId":"indonesia"}',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch {
                return {};
            }
        }
        return value ?? {};
    }),
    __metadata("design:type", Object)
], ConversationFilterDto.prototype, "customFilters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '채널 설정 ID 필터',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ConversationFilterDto.prototype, "channelConfigId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '언어 필터 (단일)',
        example: 'en',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationFilterDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '채널 필터 (복수)',
        type: [String],
        example: ['whatsapp', 'instagram'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.split(',') : value),
    __metadata("design:type", Array)
], ConversationFilterDto.prototype, "channels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '언어 필터 (복수)',
        type: [String],
        example: ['en', 'id'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.split(',') : value),
    __metadata("design:type", Array)
], ConversationFilterDto.prototype, "languages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '예약 배지 필터 (COMPLETED, CONFIRMED, IN_PROGRESS)',
        enum: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationFilterDto.prototype, "reservationBadge", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호',
        default: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ConversationFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지당 개수',
        default: 20,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ConversationFilterDto.prototype, "limit", void 0);
class AssignDto {
    userId;
}
exports.AssignDto = AssignDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '담당자 ID (null이면 배정 해제)',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], AssignDto.prototype, "userId", void 0);
class UpdateTagsDto {
    tags;
}
exports.UpdateTagsDto = UpdateTagsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '태그 목록',
        type: [String],
        example: ['urgent', 'vip'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateTagsDto.prototype, "tags", void 0);
class UpdateStatusDto {
    status;
}
exports.UpdateStatusDto = UpdateStatusDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상태',
        enum: ['open', 'closed', 'snoozed'],
    }),
    (0, class_validator_1.IsEnum)(['open', 'closed', 'snoozed']),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
//# sourceMappingURL=conversation-filter.dto.js.map