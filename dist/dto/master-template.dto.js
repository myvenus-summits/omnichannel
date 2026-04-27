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
exports.UpdateVariableMappingDto = exports.DeployMasterTemplateDto = exports.ImportMasterTemplateDto = void 0;
const class_validator_1 = require("class-validator");
class ImportMasterTemplateDto {
    clinicId;
    twilioSid;
    name;
    category;
    variableMapping;
}
exports.ImportMasterTemplateDto = ImportMasterTemplateDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ImportMasterTemplateDto.prototype, "clinicId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ImportMasterTemplateDto.prototype, "twilioSid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ImportMasterTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['UTILITY', 'MARKETING', 'AUTHENTICATION']),
    __metadata("design:type", String)
], ImportMasterTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ImportMasterTemplateDto.prototype, "variableMapping", void 0);
class DeployMasterTemplateDto {
    clinicIds;
}
exports.DeployMasterTemplateDto = DeployMasterTemplateDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], DeployMasterTemplateDto.prototype, "clinicIds", void 0);
class UpdateVariableMappingDto {
    variableMapping;
}
exports.UpdateVariableMappingDto = UpdateVariableMappingDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateVariableMappingDto.prototype, "variableMapping", void 0);
//# sourceMappingURL=master-template.dto.js.map