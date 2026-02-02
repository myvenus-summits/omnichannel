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
exports.ContactChannel = void 0;
const typeorm_1 = require("typeorm");
/**
 * 고객-채널 연결 엔티티
 * 같은 고객이 여러 채널을 통해 연락할 수 있으므로
 * 고객 ID와 채널별 식별자를 연결합니다.
 */
let ContactChannel = class ContactChannel {
    id;
    /**
     * 내부 고객 ID (CRM 고객 테이블과 연결)
     * nullable: 아직 매칭되지 않은 고객일 수 있음
     */
    contactId;
    channel;
    /**
     * 채널별 고객 식별자
     * WhatsApp: +821012345678
     * Instagram: username
     * LINE: userId
     */
    channelIdentifier;
    /**
     * 채널에서 가져온 프로필 이름
     */
    channelDisplayName;
    /**
     * 채널에서 가져온 프로필 이미지 URL
     */
    channelProfileUrl;
    /**
     * 채널별 추가 메타데이터
     */
    metadata;
    /**
     * 이 채널을 통한 마지막 연락 시간
     */
    lastContactedAt;
    createdAt;
    updatedAt;
};
exports.ContactChannel = ContactChannel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], ContactChannel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ContactChannel.prototype, "contactId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], ContactChannel.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_identifier', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ContactChannel.prototype, "channelIdentifier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_display_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ContactChannel.prototype, "channelDisplayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'channel_profile_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ContactChannel.prototype, "channelProfileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ContactChannel.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_contacted_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ContactChannel.prototype, "lastContactedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ContactChannel.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ContactChannel.prototype, "updatedAt", void 0);
exports.ContactChannel = ContactChannel = __decorate([
    (0, typeorm_1.Entity)('omni_contact_channels'),
    (0, typeorm_1.Unique)(['channel', 'channelIdentifier']),
    (0, typeorm_1.Index)(['contactId'])
], ContactChannel);
//# sourceMappingURL=contact-channel.entity.js.map