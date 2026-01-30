import type { ChannelAdapter } from './channel.adapter.interface';
import type { MessageContent, SendMessageResult, NormalizedWebhookEvent, NormalizedMessage, ChannelType } from '../types';
import { type OmnichannelModuleOptions } from '../interfaces';
export declare class WhatsAppAdapter implements ChannelAdapter {
    private readonly options?;
    private readonly logger;
    private readonly client;
    private readonly conversationsServiceSid;
    private readonly whatsappNumber;
    private readonly apiKeySid;
    private readonly apiKeySecret;
    private readonly accountSid;
    readonly channel: ChannelType;
    constructor(options?: OmnichannelModuleOptions | undefined);
    sendMessage(to: string, content: MessageContent): Promise<SendMessageResult>;
    sendTemplateMessage(to: string, templateId: string, variables: Record<string, string>): Promise<SendMessageResult>;
    parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null;
    fetchMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<NormalizedMessage[]>;
    generateAccessToken(identity: string): Promise<string>;
    private mapMediaType;
    private mapTwilioStatus;
}
//# sourceMappingURL=whatsapp.adapter.d.ts.map