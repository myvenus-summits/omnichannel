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
exports.TemplateHistoryFilterDto = exports.SendTemplateDto = exports.UpdateMessageTemplateDto = exports.CreateMessageTemplateDto = void 0;
const class_validator_1 = require("class-validator");
class CreateMessageTemplateDto {
    name;
    content;
    variables;
    category;
    twilioContentSid;
    previewText;
}
exports.CreateMessageTemplateDto = CreateMessageTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMessageTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMessageTemplateDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateMessageTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMessageTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMessageTemplateDto.prototype, "twilioContentSid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMessageTemplateDto.prototype, "previewText", void 0);
class UpdateMessageTemplateDto {
    name;
    content;
    variables;
    category;
    status;
    twilioContentSid;
    previewText;
}
exports.UpdateMessageTemplateDto = UpdateMessageTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageTemplateDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateMessageTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['draft', 'pending', 'approved', 'rejected']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageTemplateDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageTemplateDto.prototype, "twilioContentSid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMessageTemplateDto.prototype, "previewText", void 0);
class SendTemplateDto {
    recipientIdentifier; // e.g., whatsapp:+821012345678
    variables; // e.g., { customerName: 'John' }
    conversationId;
}
exports.SendTemplateDto = SendTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendTemplateDto.prototype, "recipientIdentifier", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SendTemplateDto.prototype, "conversationId", void 0);
class TemplateHistoryFilterDto {
    templateId;
    status;
    startDate;
    endDate;
    limit;
    offset;
}
exports.TemplateHistoryFilterDto = TemplateHistoryFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TemplateHistoryFilterDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateHistoryFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateHistoryFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TemplateHistoryFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TemplateHistoryFilterDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TemplateHistoryFilterDto.prototype, "offset", void 0);
//# sourceMappingURL=message-template.dto.js.map