export declare class ArchiveFilterDto {
    daysOld?: number;
    limit?: number;
}
export interface ArchiveData {
    archivedAt: Date;
    conversation: {
        id: number;
        channel: string;
        contactIdentifier: string;
        contactName: string | null;
        customerId: number | null;
        status: string;
        tags: string[];
        assignedUserId: number | null;
        createdAt: Date;
        closedAt: Date | null;
        metadata: Record<string, unknown> | null;
    };
    messages: Array<{
        id: number;
        direction: string;
        senderName: string | null;
        contentType: string;
        contentText: string | null;
        contentMediaUrl: string | null;
        timestamp: Date;
        metadata: Record<string, unknown> | null;
    }>;
    memos?: Array<{
        content: string;
        createdAt: Date;
    }>;
    stats: {
        totalMessages: number;
        dateRange: {
            from: Date;
            to: Date;
        };
    };
}
export interface ArchiveResult {
    conversationId: number;
    archiveUrl: string;
    messageCount: number;
    archivedAt: Date;
}
export interface ArchivedConversationRecord {
    id?: number;
    originalConversationId: number;
    customerId: number | null;
    channel: string;
    contactName: string | null;
    archiveUrl: string;
    messageCount: number;
    dateFrom: Date;
    dateTo: Date;
    archivedAt: Date;
}
//# sourceMappingURL=archive.dto.d.ts.map