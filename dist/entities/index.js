"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmnichannelEntities = void 0;
__exportStar(require("./conversation.entity"), exports);
__exportStar(require("./message.entity"), exports);
__exportStar(require("./contact-channel.entity"), exports);
__exportStar(require("./quick-reply.entity"), exports);
const conversation_entity_1 = require("./conversation.entity");
const message_entity_1 = require("./message.entity");
const contact_channel_entity_1 = require("./contact-channel.entity");
const quick_reply_entity_1 = require("./quick-reply.entity");
/**
 * Omnichannel 모듈의 모든 TypeORM 엔티티
 * TypeOrmModule.forFeature()에서 사용
 */
exports.OmnichannelEntities = [
    conversation_entity_1.Conversation,
    message_entity_1.Message,
    contact_channel_entity_1.ContactChannel,
    quick_reply_entity_1.QuickReply,
];
//# sourceMappingURL=index.js.map