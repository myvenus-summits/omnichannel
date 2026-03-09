import type { CreateMessageDto } from '../dto';
import type { IMessage, IMessageRepository } from '../interfaces';
import { type OmnichannelModuleOptions } from '../interfaces';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { InstagramAdapter } from '../adapters/instagram.adapter';
import { ConversationService } from './conversation.service';
import type { MessageDirection, MessageStatus } from '../types';
export declare class MessageService {
    private readonly messageRepository;
    private readonly moduleOptions;
    private readonly whatsappAdapter;
    private readonly instagramAdapter;
    private readonly conversationService;
    private readonly logger;
    constructor(messageRepository: IMessageRepository, moduleOptions: OmnichannelModuleOptions | undefined, whatsappAdapter: WhatsAppAdapter, instagramAdapter: InstagramAdapter, conversationService: ConversationService);
    /**
     * channelConfigId로 동적 credentials 조회
     */
    private resolveCredentials;
    findByConversation(conversationId: number, options?: {
        limit?: number;
        before?: string;
    }): Promise<IMessage[]>;
    findOne(id: number): Promise<IMessage>;
    create(data: Partial<IMessage>): Promise<IMessage>;
    sendMessage(conversationId: number, dto: CreateMessageDto, senderUserId?: number, senderName?: string): Promise<IMessage>;
    createFromWebhook(conversationId: number, data: {
        channelMessageId: string;
        direction: MessageDirection;
        senderName?: string;
        contentType: string;
        contentText?: string;
        contentMediaUrl?: string;
        timestamp: Date;
        metadata?: Record<string, unknown>;
    }): Promise<IMessage>;
    updateStatus(channelMessageId: string, status: MessageStatus, errorMetadata?: {
        errorCode?: number;
        errorMessage?: string;
    }): Promise<void>;
    /**
     * Instagram 대화의 메시지를 Instagram API에서 가져와 누락된 메시지를 DB에 저장
     */
    syncInstagramMessages(conversationId: number): Promise<{
        synced: number;
    }>;
    resendMessage(messageId: number): Promise<IMessage>;
}
//# sourceMappingURL=message.service.d.ts.map