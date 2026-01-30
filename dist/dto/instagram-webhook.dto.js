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
exports.InstagramWebhookDto = exports.InstagramWebhookEntry = exports.InstagramMessagingEvent = exports.InstagramReaction = exports.InstagramRead = exports.InstagramDelivery = exports.InstagramMessage = exports.InstagramMessageAttachment = exports.InstagramRecipient = exports.InstagramSender = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * Instagram Messaging Webhook Payload
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
 */
class InstagramSender {
    id;
}
exports.InstagramSender = InstagramSender;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Instagram-scoped ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramSender.prototype, "id", void 0);
class InstagramRecipient {
    id;
}
exports.InstagramRecipient = InstagramRecipient;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Instagram-scoped ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramRecipient.prototype, "id", void 0);
class InstagramMessageAttachment {
    type;
    payload;
}
exports.InstagramMessageAttachment = InstagramMessageAttachment;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Attachment type (image, video, audio, file)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramMessageAttachment.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Attachment payload' }),
    __metadata("design:type", Object)
], InstagramMessageAttachment.prototype, "payload", void 0);
class InstagramMessage {
    mid;
    text;
    attachments;
    quick_reply;
    reply_to;
    is_deleted;
    is_echo;
    is_unsupported;
}
exports.InstagramMessage = InstagramMessage;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramMessage.prototype, "mid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Text content' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramMessage.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Attachments' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], InstagramMessage.prototype, "attachments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quick reply payload' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InstagramMessage.prototype, "quick_reply", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Reply to message' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InstagramMessage.prototype, "reply_to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is deleted' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], InstagramMessage.prototype, "is_deleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is echo' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], InstagramMessage.prototype, "is_echo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Is unsupported' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], InstagramMessage.prototype, "is_unsupported", void 0);
class InstagramDelivery {
    mids;
    watermark;
}
exports.InstagramDelivery = InstagramDelivery;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Delivered message IDs' }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], InstagramDelivery.prototype, "mids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Delivery watermark timestamp' }),
    __metadata("design:type", Number)
], InstagramDelivery.prototype, "watermark", void 0);
class InstagramRead {
    watermark;
}
exports.InstagramRead = InstagramRead;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Read watermark timestamp' }),
    __metadata("design:type", Number)
], InstagramRead.prototype, "watermark", void 0);
class InstagramReaction {
    mid;
    action;
    reaction;
    emoji;
}
exports.InstagramReaction = InstagramReaction;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target message ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramReaction.prototype, "mid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reaction action (react/unreact)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramReaction.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Reaction emoji' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramReaction.prototype, "reaction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Reaction emoji' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramReaction.prototype, "emoji", void 0);
class InstagramMessagingEvent {
    sender;
    recipient;
    timestamp;
    message;
    delivery;
    read;
    reaction;
}
exports.InstagramMessagingEvent = InstagramMessagingEvent;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sender information' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InstagramSender),
    __metadata("design:type", InstagramSender)
], InstagramMessagingEvent.prototype, "sender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recipient information' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InstagramRecipient),
    __metadata("design:type", InstagramRecipient)
], InstagramMessagingEvent.prototype, "recipient", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event timestamp' }),
    __metadata("design:type", Number)
], InstagramMessagingEvent.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message event' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InstagramMessage),
    __metadata("design:type", InstagramMessage)
], InstagramMessagingEvent.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Delivery event' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InstagramDelivery),
    __metadata("design:type", InstagramDelivery)
], InstagramMessagingEvent.prototype, "delivery", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Read event' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InstagramRead),
    __metadata("design:type", InstagramRead)
], InstagramMessagingEvent.prototype, "read", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Reaction event' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InstagramReaction),
    __metadata("design:type", InstagramReaction)
], InstagramMessagingEvent.prototype, "reaction", void 0);
class InstagramWebhookEntry {
    id;
    time;
    messaging;
}
exports.InstagramWebhookEntry = InstagramWebhookEntry;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Instagram Business Account ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramWebhookEntry.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Entry timestamp' }),
    __metadata("design:type", Number)
], InstagramWebhookEntry.prototype, "time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Messaging events' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InstagramMessagingEvent),
    __metadata("design:type", Array)
], InstagramWebhookEntry.prototype, "messaging", void 0);
class InstagramWebhookDto {
    object;
    entry;
}
exports.InstagramWebhookDto = InstagramWebhookDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Object type (always "instagram")' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InstagramWebhookDto.prototype, "object", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Webhook entries' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InstagramWebhookEntry),
    __metadata("design:type", Array)
], InstagramWebhookDto.prototype, "entry", void 0);
//# sourceMappingURL=instagram-webhook.dto.js.map