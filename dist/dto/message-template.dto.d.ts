import type { TemplateStatus } from '../interfaces';
export declare class CreateMessageTemplateDto {
    name: string;
    content: string;
    variables?: string[];
    category?: string;
    twilioContentSid?: string;
    previewText?: string;
}
export declare class UpdateMessageTemplateDto {
    name?: string;
    content?: string;
    variables?: string[];
    category?: string;
    status?: TemplateStatus;
    twilioContentSid?: string;
    previewText?: string;
}
export declare class SendTemplateDto {
    recipientIdentifier: string;
    variables?: Record<string, string>;
    conversationId?: number;
}
export declare class TemplateHistoryFilterDto {
    templateId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}
//# sourceMappingURL=message-template.dto.d.ts.map