import type { TwilioConfig } from '../interfaces/omnichannel-options.interface';
import type { ApprovalStatus } from '../interfaces/master-template.interface';
export interface TwilioContentItem {
    sid: string;
    name: string;
    language: string;
    variables: Record<string, unknown>;
    types: Record<string, unknown>;
    body: string;
    dateUpdated: Date;
    approvalStatus?: string;
    category?: string;
    rejectionReason?: string;
}
export interface CreateTwilioContentData {
    friendlyName: string;
    language: string;
    body: string;
    types?: Record<string, unknown>;
    variables?: Record<string, unknown>;
}
export declare class TwilioContentClient {
    private readonly logger;
    private readonly clients;
    private getClient;
    private extractBody;
    listApproved(config: TwilioConfig, search?: string): Promise<TwilioContentItem[]>;
    listAll(config: TwilioConfig, search?: string): Promise<TwilioContentItem[]>;
    getOne(sid: string, config: TwilioConfig): Promise<TwilioContentItem>;
    create(data: CreateTwilioContentData, config: TwilioConfig): Promise<TwilioContentItem>;
    submitApproval(sid: string, data: {
        name: string;
        category: string;
    }, config: TwilioConfig): Promise<void>;
    getApprovalStatus(sid: string, config: TwilioConfig): Promise<{
        status: ApprovalStatus;
        category?: string;
        rejectionReason?: string;
    }>;
    delete(sid: string, config: TwilioConfig): Promise<void>;
}
//# sourceMappingURL=twilio-content.client.d.ts.map