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
exports.Conversation = void 0;
const typeorm_1 = require("typeorm");
// Forward reference to avoid circular dependency
// Message entity will be imported at runtime
let Conversation = class Conversation {
    id;
    channel;
    channelConversationId;
    contactIdentifier;
    contactName;
    status;
    tags;
    assignedUserId;
    unreadCount;
    lastMessageAt;
    lastMessagePreview;
    metadata;
    messages;
    createdAt;
    updatedAt;
};
exports.Conversation = Conversation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Conversation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Conversation.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_conversation_id', unique: true }),
    __metadata("design:type", String)
], Conversation.prototype, "channelConversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_identifier' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Conversation.prototype, "contactIdentifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_name', nullable: true }),
    __metadata("design:type", Object)
], Conversation.prototype, "contactName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'open' }),
    __metadata("design:type", String)
], Conversation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, default: [] }),
    __metadata("design:type", Array)
], Conversation.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_user_id', nullable: true, type: 'bigint' }),
    __metadata("design:type", Object)
], Conversation.prototype, "assignedUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unread_count', default: 0 }),
    __metadata("design:type", Number)
], Conversation.prototype, "unreadCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Conversation.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_preview', nullable: true }),
    __metadata("design:type", Object)
], Conversation.prototype, "lastMessagePreview", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Conversation.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Message', 'conversation'),
    __metadata("design:type", Array)
], Conversation.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Conversation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Conversation.prototype, "updatedAt", void 0);
exports.Conversation = Conversation = __decorate([
    (0, typeorm_1.Entity)('omni_conversations'),
    (0, typeorm_1.Index)(['channel', 'status']),
    (0, typeorm_1.Index)(['assignedUserId', 'status']),
    (0, typeorm_1.Index)(['lastMessageAt'])
], Conversation);
//# sourceMappingURL=conversation.entity.js.map