import type { CreateMessageDto } from '../dto';
import type { IMessage, IMessageRepository } from '../interfaces';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { ConversationService } from './conversation.service';
import type { MessageDirection, MessageStatus } from '../types';
export declare class MessageService {
    private readonly messageRepository;
    private readonly whatsappAdapter;
    private readonly conversationService;
    private readonly logger;
    constructor(messageRepository: IMessageRepository, whatsappAdapter: WhatsAppAdapter, conversationService: ConversationService);
    findByConversation(conversationId: number, options?: {
        limit?: number;
        before?: string;
    }): Promise<IMessage[]>;
    findOne(id: number): Promise<IMessage>;
    create(data: Partial<IMessage>): Promise<IMessage>;
    sendMessage(conversationId: number, dto: CreateMessageDto, senderUserId?: number): Promise<IMessage>;
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
    updateStatus(channelMessageId: string, status: MessageStatus): Promise<void>;
}
//# sourceMappingURL=message.service.d.ts.map