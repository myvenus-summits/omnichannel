import { IStorageAdapter, IConversationRepository, IMessageRepository } from '../interfaces';
import type { IConversation } from '../interfaces';
import type { ArchiveData, ArchiveResult, ArchivedConversationRecord } from '../dto/archive.dto';
export interface IArchivedConversationRepository {
    create(data: ArchivedConversationRecord): Promise<ArchivedConversationRecord>;
    findByCustomerId(customerId: number): Promise<ArchivedConversationRecord[]>;
    findByOriginalId(conversationId: number): Promise<ArchivedConversationRecord | null>;
}
export declare const ARCHIVED_CONVERSATION_REPOSITORY: unique symbol;
export declare class ArchiveService {
    private readonly storage;
    private readonly conversationRepository;
    private readonly messageRepository;
    private readonly archivedConversationRepository;
    private readonly logger;
    constructor(storage: IStorageAdapter | null, conversationRepository: IConversationRepository, messageRepository: IMessageRepository, archivedConversationRepository: IArchivedConversationRepository | null);
    /**
     * Find conversations eligible for archiving
     * Criteria: closed + older than daysOld + not already archived
     */
    findArchivable(daysOld?: number, limit?: number): Promise<IConversation[]>;
    /**
     * Archive a single conversation
     */
    archiveConversation(conversationId: number): Promise<ArchiveResult>;
    /**
     * Archive multiple old conversations (batch operation)
     */
    archiveOldConversations(daysOld?: number, limit?: number): Promise<{
        success: ArchiveResult[];
        failed: Array<{
            conversationId: number;
            error: string;
        }>;
    }>;
    /**
     * Get archived conversations for a customer
     */
    getArchivedByCustomer(customerId: number): Promise<ArchivedConversationRecord[]>;
    /**
     * Fetch archived conversation data from storage
     */
    fetchArchivedData(archiveUrl: string): Promise<ArchiveData>;
    private extractKeyFromUrl;
}
//# sourceMappingURL=archive.service.d.ts.map