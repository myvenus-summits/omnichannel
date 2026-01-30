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
exports.QuickReplyQueryDto = exports.UpdateQuickReplyDto = exports.CreateQuickReplyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateQuickReplyDto {
    title;
    content;
    shortcut;
}
exports.CreateQuickReplyDto = CreateQuickReplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '템플릿 제목', example: '예약 확인' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateQuickReplyDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '템플릿 내용',
        example: '안녕하세요! 예약이 확인되었습니다. 감사합니다.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreateQuickReplyDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '단축키 (슬래시 명령어)',
        example: '/예약',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateQuickReplyDto.prototype, "shortcut", void 0);
class UpdateQuickReplyDto extends (0, swagger_1.PartialType)(CreateQuickReplyDto) {
    isActive;
}
exports.UpdateQuickReplyDto = UpdateQuickReplyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '활성화 여부' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateQuickReplyDto.prototype, "isActive", void 0);
class QuickReplyQueryDto {
    search;
    activeOnly;
}
exports.QuickReplyQueryDto = QuickReplyQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '검색어 (제목, 내용, 단축키)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuickReplyQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '활성화된 것만 조회', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QuickReplyQueryDto.prototype, "activeOnly", void 0);
//# sourceMappingURL=quick-reply.dto.js.map