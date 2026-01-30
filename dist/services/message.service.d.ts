import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import type { CreateMessageDto } from '../dto';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { ConversationService } from './conversation.service';
import type { MessageDirection, MessageStatus } from '../types';
export declare class MessageService {
    private readonly messageRepository;
    private readonly conversationRepository;
    private readonly whatsappAdapter;
    private readonly conversationService;
    private readonly logger;
    constructor(messageRepository: Repository<Message>, conversationRepository: Repository<Conversation>, whatsappAdapter: WhatsAppAdapter, conversationService: ConversationService);
    findByConversation(conversationId: number, options?: {
        limit?: number;
        before?: string;
    }): Promise<Message[]>;
    findOne(id: number): Promise<Message>;
    create(data: Partial<Message>): Promise<Message>;
    sendMessage(conversationId: number, dto: CreateMessageDto, senderUserId?: number): Promise<Message>;
    createFromWebhook(conversationId: number, data: {
        channelMessageId: string;
        direction: MessageDirection;
        senderName?: string;
        contentType: string;
        contentText?: string;
        contentMediaUrl?: string;
        timestamp: Date;
        metadata?: Record<string, unknown>;
    }): Promise<Message>;
    updateStatus(channelMessageId: string, status: MessageStatus): Promise<void>;
}
//# sourceMappingURL=message.service.d.ts.map