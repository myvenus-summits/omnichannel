"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const twilio_1 = require("twilio");
const webhook_service_1 = require("../services/webhook.service");
const dto_1 = require("../dto");
const interfaces_1 = require("../interfaces");
let WebhookController = WebhookController_1 = class WebhookController {
    options;
    webhookService;
    logger = new common_1.Logger(WebhookController_1.name);
    appUrl;
    twilioAuthToken;
    constructor(options, webhookService) {
        this.options = options;
        this.webhookService = webhookService;
        this.appUrl = options?.appUrl ?? '';
        this.twilioAuthToken = options?.twilio?.authToken ?? '';
    }
    async handleTwilio(req, payload) {
        const twilioSignature = req.headers['x-twilio-signature'];
        const webhookUrl = `${this.appUrl}/webhooks/twilio`;
        if (this.twilioAuthToken && twilioSignature) {
            const isValid = (0, twilio_1.validateRequest)(this.twilioAuthToken, twilioSignature, webhookUrl, req.body);
            if (!isValid) {
                this.logger.warn('Invalid Twilio signature detected');
                throw new common_1.UnauthorizedException('Invalid Twilio signature');
            }
        }
        else if (process.env['NODE_ENV'] === 'production') {
            this.logger.error('Missing Twilio signature or auth token in production');
            throw new common_1.UnauthorizedException('Twilio signature verification required');
        }
        this.logger.log(`Received Twilio webhook: ${payload.EventType}`);
        try {
            await this.webhookService.handleTwilioWebhook(payload);
            return { success: true };
        }
        catch (error) {
            this.logger.error('Failed to process Twilio webhook', error);
            return { success: false, error: 'Processing failed' };
        }
    }
    verifyMeta(query) {
        this.logger.log('Meta webhook verification request');
        if (query['hub.mode'] !== 'subscribe') {
            throw new common_1.BadRequestException('Invalid hub.mode');
        }
        const challenge = this.webhookService.verifyMetaWebhook(query['hub.verify_token'], query['hub.challenge']);
        if (challenge) {
            return challenge;
        }
        throw new common_1.BadRequestException('Verification failed');
    }
    handleMeta(payload) {
        this.logger.log('Received Meta webhook');
        try {
            this.webhookService.handleMetaWebhook(payload);
            return 'EVENT_RECEIVED';
        }
        catch (error) {
            this.logger.error('Failed to process Meta webhook', error);
            return 'EVENT_RECEIVED';
        }
    }
    async handleTwilioStatus(req, payload) {
        const twilioSignature = req.headers['x-twilio-signature'];
        const webhookUrl = `${this.appUrl}/webhooks/twilio/status`;
        if (this.twilioAuthToken && twilioSignature) {
            const isValid = (0, twilio_1.validateRequest)(this.twilioAuthToken, twilioSignature, webhookUrl, req.body);
            if (!isValid) {
                this.logger.warn('Invalid Twilio signature on status callback');
                throw new common_1.UnauthorizedException('Invalid Twilio signature');
            }
        }
        else if (process.env['NODE_ENV'] === 'production') {
            throw new common_1.UnauthorizedException('Twilio signature verification required');
        }
        this.logger.log('Received Twilio status callback');
        try {
            await this.webhookService.handleTwilioWebhook(payload);
            return { success: true };
        }
        catch (error) {
            this.logger.error('Failed to process Twilio status callback', error);
            return { success: false };
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('twilio'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Twilio Webhook 수신' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook 처리 완료' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid Twilio signature' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.TwilioWebhookDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleTwilio", null);
__decorate([
    (0, common_1.Get)('meta'),
    (0, swagger_1.ApiOperation)({ summary: 'Meta Webhook 검증 (GET)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Challenge 반환' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '검증 실패' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MetaVerifyDto]),
    __metadata("design:returntype", void 0)
], WebhookController.prototype, "verifyMeta", null);
__decorate([
    (0, common_1.Post)('meta'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Meta Webhook 수신 (Instagram/Messenger)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook 처리 완료' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhookController.prototype, "handleMeta", null);
__decorate([
    (0, common_1.Post)('twilio/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleTwilioStatus", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(interfaces_1.OMNICHANNEL_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object, webhook_service_1.WebhookService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map