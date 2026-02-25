import type { ChannelType, ConversationStatus } from '../types';
export declare class ConversationFilterDto {
    channel?: ChannelType;
    status?: ConversationStatus;
    assignedUserId?: number;
    unassigned?: boolean;
    tags?: string[];
    search?: string;
    clinicId?: number;
    regionId?: number;
    channelConfigId?: number;
    language?: string;
    channels?: string[];
    languages?: string[];
    page?: number;
    limit?: number;
}
export declare class AssignDto {
    userId?: number | null;
}
export declare class UpdateTagsDto {
    tags: string[];
}
export declare class UpdateStatusDto {
    status: ConversationStatus;
}
//# sourceMappingURL=conversation-filter.dto.d.ts.map