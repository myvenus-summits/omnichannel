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
exports.Message = void 0;
const typeorm_1 = require("typeorm");
const conversation_entity_1 = require("./conversation.entity");
let Message = class Message {
    id;
    conversation;
    conversationId;
    channelMessageId;
    direction;
    senderName;
    senderUserId;
    contentType;
    contentText;
    contentMediaUrl;
    status;
    metadata;
    createdAt;
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Conversation', 'messages'),
    (0, typeorm_1.JoinColumn)({ name: 'conversation_id' }),
    __metadata("design:type", conversation_entity_1.Conversation)
], Message.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_id', type: 'bigint' }),
    __metadata("design:type", Number)
], Message.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_message_id', type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], Message.prototype, "channelMessageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], Message.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "senderName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_user_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "senderUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_type', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Message.prototype, "contentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_text', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "contentText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_media_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "contentMediaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'sent' }),
    __metadata("design:type", String)
], Message.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('omni_messages'),
    (0, typeorm_1.Index)(['conversationId', 'createdAt'])
], Message);
//# sourceMappingURL=message.entity.js.map