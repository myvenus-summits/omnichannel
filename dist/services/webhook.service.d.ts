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
/**
 * 광고(유료 유입)로 귀속된 referral 인지 판정한다 — 대화 referral 의 첫 유입 보호 대상.
 *
 * `ctwaClid` · `sourceId` 중 하나가 있거나 `sourceType` 이 `ad`·`ads` 면 광고로 본다.
 * 서비스들이 광고를 가르는 판정의 합집합이다 — 어느 한 곳이라도 광고로 읽는 referral 은
 * 덮지 않아야, 그 서비스가 이미 그 값으로 보낸 이벤트·집계와 어긋나지 않는다.
 * 예: 랜딩 유입을 표시하려고 서비스가 직접 쓰는 `{ sourceId, sourceType: 'landing' }` 은
 * `ctwaClid` 가 없지만 광고다(덮으면 같은 리드로 Lead 이벤트가 두 번 나간다).
 *
 * 광고가 아닌 것: `{ numMedia }` 뿐인 것, `sourceId` 없는 게시물(`sourceType: 'post'`)·wa.me 링크(`sourceUrl` 만).
 * `sourceId` 가 있으면 `sourceType` 이 무엇이든 광고로 본다 — 일부 서비스가 `sourceId` 만으로
 * 광고를 판정하므로, 그런 referral 을 바꾸면 그 서비스의 귀속이 바뀐다(보수적으로 보호).
 */
export declare function isAdReferral(referral: unknown): boolean;
/**
 * 인바운드 메시지의 referral 로 대화 referral 을 채울지(또는 바꿀지) 정한다.
 *
 * - 대화에 출처 정보가 있는 referral 이 없으면(비어 있거나 `{ numMedia }` 뿐) 채운다.
 * - 대화 referral 이 광고가 아니고 메시지 referral 이 광고면 바꾼다 — 광고가 아닌 것이
 *   먼저 자리를 잡아 뒤의 광고 클릭이 대화에 남지 않던 문제(MD-775).
 * - 광고 referral 끼리는 첫 유입을 유지한다(덮지 않는다).
 */
export declare function shouldReplaceConversationReferral(existingReferral: unknown, messageReferral: unknown): boolean;
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