import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import {
  IStorageAdapter,
  STORAGE_ADAPTER,
  IConversationRepository,
  IMessageRepository,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
} from '../interfaces';
import type { IConversation, IMessage } from '../interfaces';
import type {
  ArchiveData,
  ArchiveResult,
  ArchivedConversationRecord,
} from '../dto/archive.dto';

export interface IArchivedConversationRepository {
  create(data: ArchivedConversationRecord): Promise<ArchivedConversationRecord>;
  findByCustomerId(customerId: number): Promise<ArchivedConversationRecord[]>;
  findByOriginalId(conversationId: number): Promise<ArchivedConversationRecord | null>;
}

export const ARCHIVED_CONVERSATION_REPOSITORY = Symbol('ARCHIVED_CONVERSATION_REPOSITORY');

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);

  constructor(
    @Optional()
    @Inject(STORAGE_ADAPTER)
    private readonly storage: IStorageAdapter | null,

    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,

    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,

    @Optional()
    @Inject(ARCHIVED_CONVERSATION_REPOSITORY)
    private readonly archivedConversationRepository: IArchivedConversationRepository | null,
  ) {
    if (!this.storage) {
      this.logger.warn('Storage adapter not configured - archive operations will fail');
    }
  }

  /**
   * Find conversations eligible for archiving
   * Criteria: closed + older than daysOld + not already archived
   */
  async findArchivable(daysOld: number = 90, limit: number = 100): Promise<IConversation[]> {
    if (!this.conversationRepository.findArchivable) {
      throw new Error('findArchivable not implemented in conversation repository');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.conversationRepository.findArchivable(cutoffDate, limit);
  }

  /**
   * Archive a single conversation
   */
  async archiveConversation(conversationId: number): Promise<ArchiveResult> {
    if (!this.storage) {
      throw new Error('Storage adapter not configured');
    }

    // 1. Get conversation
    const conversation = await this.conversationRepository.findOne(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (conversation.archivedAt) {
      throw new Error(`Conversation ${conversationId} is already archived`);
    }

    // 2. Get all messages
    if (!this.messageRepository.findAllByConversation) {
      throw new Error('findAllByConversation not implemented in message repository');
    }
    const messages = await this.messageRepository.findAllByConversation(conversationId);

    // 3. Build archive data
    const archiveData: ArchiveData = {
      archivedAt: new Date(),
      conversation: {
        id: conversation.id,
        channel: conversation.channel,
        contactIdentifier: conversation.contactIdentifier,
        contactName: conversation.contactName,
        customerId: conversation.customerId ?? null,
        status: conversation.status,
        tags: conversation.tags ?? [],
        assignedUserId: conversation.assignedUserId ?? null,
        createdAt: conversation.createdAt,
        closedAt: conversation.closedAt ?? null,
        metadata: conversation.metadata ?? null,
      },
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        senderName: m.senderName ?? null,
        contentType: m.contentType,
        contentText: m.contentText ?? null,
        contentMediaUrl: m.contentMediaUrl ?? null,
        timestamp: m.createdAt,
        metadata: m.metadata ?? null,
      })),
      stats: {
        totalMessages: messages.length,
        dateRange: {
          from: messages[0]?.createdAt ?? conversation.createdAt,
          to: messages[messages.length - 1]?.createdAt ?? conversation.createdAt,
        },
      },
    };

    // 4. Upload to storage
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const key = `omnichannel/conversations/${year}/${month}/conv-${conversationId}.json`;

    const jsonData = JSON.stringify(archiveData, null, 2);
    const archiveUrl = await this.storage.upload(key, jsonData);

    this.logger.log(`Uploaded archive for conversation ${conversationId} to ${archiveUrl}`);

    // 5. Update conversation with archive info
    await this.conversationRepository.update(conversationId, {
      archivedAt: now,
      archiveUrl,
    });

    // 6. Save to archived_conversations table if repository is available
    if (this.archivedConversationRepository) {
      await this.archivedConversationRepository.create({
        originalConversationId: conversationId,
        customerId: conversation.customerId ?? null,
        channel: conversation.channel,
        contactName: conversation.contactName,
        archiveUrl,
        messageCount: messages.length,
        dateFrom: archiveData.stats.dateRange.from,
        dateTo: archiveData.stats.dateRange.to,
        archivedAt: now,
      });
    }

    // 7. Delete messages from DB
    if (!this.messageRepository.deleteByConversation) {
      throw new Error('deleteByConversation not implemented in message repository');
    }
    await this.messageRepository.deleteByConversation(conversationId);

    this.logger.log(
      `Archived conversation ${conversationId}: ${messages.length} messages deleted`,
    );

    return {
      conversationId,
      archiveUrl,
      messageCount: messages.length,
      archivedAt: now,
    };
  }

  /**
   * Archive multiple old conversations (batch operation)
   */
  async archiveOldConversations(
    daysOld: number = 90,
    limit: number = 100,
  ): Promise<{
    success: ArchiveResult[];
    failed: Array<{ conversationId: number; error: string }>;
  }> {
    const targets = await this.findArchivable(daysOld, limit);

    this.logger.log(`Found ${targets.length} conversations to archive (${daysOld}+ days old)`);

    const success: ArchiveResult[] = [];
    const failed: Array<{ conversationId: number; error: string }> = [];

    for (const conversation of targets) {
      try {
        const result = await this.archiveConversation(conversation.id);
        success.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to archive conversation ${conversation.id}: ${errorMessage}`);
        failed.push({ conversationId: conversation.id, error: errorMessage });
      }
    }

    this.logger.log(
      `Archive batch complete: ${success.length} succeeded, ${failed.length} failed`,
    );

    return { success, failed };
  }

  /**
   * Get archived conversations for a customer
   */
  async getArchivedByCustomer(customerId: number): Promise<ArchivedConversationRecord[]> {
    if (!this.archivedConversationRepository) {
      // Fallback: query conversations table
      if (!this.conversationRepository.findArchivedByCustomer) {
        return []; // No way to get archived conversations
      }
      const conversations = await this.conversationRepository.findArchivedByCustomer(customerId);
      return conversations.map((c) => ({
        originalConversationId: c.id,
        customerId: c.customerId ?? null,
        channel: c.channel,
        contactName: c.contactName,
        archiveUrl: c.archiveUrl!,
        messageCount: 0, // Unknown without separate table
        dateFrom: c.createdAt,
        dateTo: c.closedAt ?? c.createdAt,
        archivedAt: c.archivedAt!,
      }));
    }

    return this.archivedConversationRepository.findByCustomerId(customerId);
  }

  /**
   * Fetch archived conversation data from storage
   */
  async fetchArchivedData(archiveUrl: string): Promise<ArchiveData> {
    if (!this.storage) {
      throw new Error('Storage adapter not configured');
    }

    // Extract key from URL or use as-is
    const key = this.extractKeyFromUrl(archiveUrl);
    const data = await this.storage.download(key);

    return JSON.parse(data) as ArchiveData;
  }

  private extractKeyFromUrl(url: string): string {
    // If it's a full URL, extract the path after the bucket
    // e.g., https://cdn.example.com/omnichannel/... → omnichannel/...
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\//, '');
    }
    return url;
  }
}
