import type { MessageContentType } from '../types';
export declare class CreateMessageDto {
    contentType: MessageContentType;
    contentText?: string;
    contentMediaUrl?: string;
    replyToMessageId?: number;
    templateId?: string;
    templateVariables?: Record<string, string>;
}
//# sourceMappingURL=create-message.dto.d.ts.map