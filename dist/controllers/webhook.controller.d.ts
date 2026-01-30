import type { Request } from 'express';
import { WebhookService } from '../services/webhook.service';
import { TwilioWebhookDto, MetaVerifyDto } from '../dto';
import { type OmnichannelModuleOptions } from '../interfaces';
export declare class WebhookController {
    private readonly options;
    private readonly webhookService;
    private readonly logger;
    private readonly appUrl;
    private readonly twilioAuthToken;
    constructor(options: OmnichannelModuleOptions | undefined, webhookService: WebhookService);
    handleTwilio(req: Request, payload: TwilioWebhookDto): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    verifyMeta(query: MetaVerifyDto): string;
    handleMeta(payload: unknown): string;
    handleTwilioStatus(req: Request, payload: unknown): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=webhook.controller.d.ts.map