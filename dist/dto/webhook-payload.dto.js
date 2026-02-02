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
exports.MetaMessagingEvent = exports.MetaWebhookEntry = exports.MetaWebhookDto = exports.MetaVerifyDto = exports.TwilioWebhookDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * Twilio Conversations API Webhook Payload
 * https://www.twilio.com/docs/conversations/conversations-webhooks
 */
class TwilioWebhookDto {
    EventType;
    ConversationSid;
    MessageSid;
    Body;
    Author;
    ParticipantSid;
    AccountSid;
    Source;
    MediaContentType;
    MediaUrl;
    DateCreated;
    // ===== Messaging API fields (Sandbox/WhatsApp) =====
    SmsMessageSid;
    SmsStatus;
    From;
    To;
    ProfileName;
    WaId;
    NumMedia;
    NumSegments;
    ReferralNumMedia;
    ApiVersion;
}
exports.TwilioWebhookDto = TwilioWebhookDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Event type (Conversations API)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "EventType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Conversation SID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "ConversationSid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message SID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "MessageSid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message body' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "Body", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Author' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "Author", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Participant SID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "ParticipantSid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Account SID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "AccountSid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Source' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "Source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Media Content Type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "MediaContentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Media URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "MediaUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date Created' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "DateCreated", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'SMS Message SID (Messaging API)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "SmsMessageSid", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'SMS Status (Messaging API)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "SmsStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'From number (Messaging API)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "From", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'To number (Messaging API)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "To", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Profile name (Messaging API - WhatsApp)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "ProfileName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'WhatsApp ID (Messaging API)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "WaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of media attachments' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "NumMedia", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of segments' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "NumSegments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Referral info (WhatsApp ads)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "ReferralNumMedia", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'API Version' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwilioWebhookDto.prototype, "ApiVersion", void 0);
/**
 * Meta Webhook Verification Query
 */
class MetaVerifyDto {
    'hub.mode';
    'hub.verify_token';
    'hub.challenge';
}
exports.MetaVerifyDto = MetaVerifyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hub mode' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetaVerifyDto.prototype, "hub.mode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hub verify token' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetaVerifyDto.prototype, "hub.verify_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hub challenge' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetaVerifyDto.prototype, "hub.challenge", void 0);
/**
 * Meta Webhook Payload (Instagram/Messenger)
 * https://developers.facebook.com/docs/messenger-platform/webhooks
 */
class MetaWebhookDto {
    object;
    entry;
}
exports.MetaWebhookDto = MetaWebhookDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Object type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MetaWebhookDto.prototype, "object", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Entry array' }),
    __metadata("design:type", Array)
], MetaWebhookDto.prototype, "entry", void 0);
class MetaWebhookEntry {
    id;
    time;
    messaging;
}
exports.MetaWebhookEntry = MetaWebhookEntry;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Page/IG user ID' }),
    __metadata("design:type", String)
], MetaWebhookEntry.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp' }),
    __metadata("design:type", Number)
], MetaWebhookEntry.prototype, "time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Messaging events' }),
    __metadata("design:type", Array)
], MetaWebhookEntry.prototype, "messaging", void 0);
class MetaMessagingEvent {
    sender;
    recipient;
    timestamp;
    message;
    delivery;
    read;
}
exports.MetaMessagingEvent = MetaMessagingEvent;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sender' }),
    __metadata("design:type", Object)
], MetaMessagingEvent.prototype, "sender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recipient' }),
    __metadata("design:type", Object)
], MetaMessagingEvent.prototype, "recipient", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp' }),
    __metadata("design:type", Number)
], MetaMessagingEvent.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Message' }),
    __metadata("design:type", Object)
], MetaMessagingEvent.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Delivery' }),
    __metadata("design:type", Object)
], MetaMessagingEvent.prototype, "delivery", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Read' }),
    __metadata("design:type", Object)
], MetaMessagingEvent.prototype, "read", void 0);
//# sourceMappingURL=webhook-payload.dto.js.map