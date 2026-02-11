import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import type { IConversationRepository, IMessageRepository, IContactChannelRepository } from '../interfaces';
import { type OmnichannelModuleOptions } from '../interfaces';
import type { InstagramWebhookDto } from '../dto/instagram-webhook.dto';
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
    constructor(options: OmnichannelModuleOptions | undefined, conversationRepository: IConversationRepository, messageRepository: IMessageRepository, contactChannelRepository: IContactChannelRepository | undefined, whatsappAdapter: WhatsAppAdapter, instagramAdapter: InstagramAdapter, omnichannelGateway: OmnichannelGateway, conversationService: ConversationService, messageService: MessageService);
    handleTwilioWebhook(payload: unknown): Promise<void>;
    handleMetaWebhook(payload: unknown): Promise<void>;
    handleInstagramWebhook(payload: InstagramWebhookDto): Promise<void>;
    verifyMetaWebhook(verifyToken: string, challenge: string): string | null;
    private processEvent;
    private handleMessageEvent;
    /**
     * Instagram 사용자 이름 비동기 해결 (fire-and-forget)
     */
    private resolveInstagramUsername;
    private handleStatusUpdate;
    private handleConversationCreated;
}
//# sourceMappingURL=webhook.service.d.ts.map