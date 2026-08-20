import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import type { IConversationRepository, IMessageRepository, IContactChannelRepository, ResolvedChannelConfig } from '../interfaces';
import { type OmnichannelModuleOptions } from '../interfaces';
import type { InstagramWebhookDto } from '../dto/instagram-webhook.dto';
/**
 * 아직 "실명"이 아닌 대화 이름인지 판정한다.
 *
 * 비어 있거나, 식별자/전화번호를 그대로 넣어둔 경우를 placeholder 로 본다:
 *   - null / '' / 공백
 *   - '+61417460236', '821020252266' 같은 번호 (웹훅 유실분 백필이 이렇게 채운다)
 *   - 'whatsapp:+61417460236' 처럼 채널 접두어가 붙은 식별자
 *
 * 실명이 이미 있으면 false 를 돌려 덮어쓰지 않게 한다.
 */
export declare function isPlaceholderContactName(name?: string | null): boolean;
export declare class WebhookService {
    private readonly options;
    private readonly conversationRepository;
    private readonly messageRepository;
    private readonly contactChannelRepository;
    private readonly whatsappAdapter;
    private readonly instagramAdapter;
    private readonly omnichannelGateway;
    private readonly conversationService;
    private readonly messageService;
    private readonly logger;
    private readonly appUrl;
    private readonly metaWebhookVerifyToken;
    private readonly webhookChannelResolver;
    private readonly mediaUrlTransformer;
    constructor(options: OmnichannelModuleOptions | undefined, conversationRepository: IConversationRepository, messageRepository: IMessageRepository, contactChannelRepository: IContactChannelRepository | undefined, whatsappAdapter: WhatsAppAdapter, instagramAdapter: InstagramAdapter, omnichannelGateway: OmnichannelGateway, conversationService: ConversationService, messageService: MessageService);
    handleTwilioWebhook(payload: unknown, preResolvedConfig?: ResolvedChannelConfig | null): Promise<void>;
    handleMetaWebhook(payload: unknown): Promise<void>;
    handleInstagramWebhook(payload: InstagramWebhookDto): Promise<void>;
    verifyMetaWebhook(verifyToken: string, challenge: string): string | null;
    private processEvent;
    private handleMessageEvent;
    /**
     * Instagram 프로필을 contact_channel에 저장 (fire-and-forget)
     */
    private saveInstagramContactProfile;
    private handleStatusUpdate;
    private handleReactionEvent;
    private handleConversationCreated;
}
//# sourceMappingURL=webhook.service.d.ts.map