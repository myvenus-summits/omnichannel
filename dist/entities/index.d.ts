export * from './conversation.entity';
export * from './message.entity';
export * from './contact-channel.entity';
export * from './quick-reply.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { ContactChannel } from './contact-channel.entity';
import { QuickReply } from './quick-reply.entity';
/**
 * Omnichannel 모듈의 모든 TypeORM 엔티티
 * TypeOrmModule.forFeature()에서 사용
 */
export declare const OmnichannelEntities: (typeof Message | typeof Conversation | typeof ContactChannel | typeof QuickReply)[];
//# sourceMappingURL=index.d.ts.map