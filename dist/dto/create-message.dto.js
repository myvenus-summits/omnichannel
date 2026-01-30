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
exports.CreateMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateMessageDto {
    contentType;
    contentText;
    contentMediaUrl;
    templateId;
    templateVariables;
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '메시지 타입',
        enum: ['text', 'image', 'file', 'template'],
        example: 'text',
    }),
    (0, class_validator_1.IsEnum)(['text', 'image', 'video', 'file', 'template']),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '텍스트 내용 (contentType이 text인 경우 필수)',
        example: '안녕하세요, 문의 감사합니다.',
    }),
    (0, class_validator_1.ValidateIf)((o) => o.contentType === 'text'),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "contentText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '미디어 URL (contentType이 image/file인 경우 필수)',
        example: 'https://example.com/image.jpg',
    }),
    (0, class_validator_1.ValidateIf)((o) => ['image', 'file'].includes(o.contentType)),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "contentMediaUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '템플릿 ID (contentType이 template인 경우 필수)',
        example: 'welcome_template',
    }),
    (0, class_validator_1.ValidateIf)((o) => o.contentType === 'template'),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '템플릿 변수 (contentType이 template인 경우)',
        example: { name: '홍길동', clinic: '마이비너스' },
    }),
    (0, class_validator_1.ValidateIf)((o) => o.contentType === 'template'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMessageDto.prototype, "templateVariables", void 0);
//# sourceMappingURL=create-message.dto.js.map