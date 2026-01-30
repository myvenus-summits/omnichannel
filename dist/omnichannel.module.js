"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OmnichannelModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmnichannelModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
// Entities
const entities_1 = require("./entities");
// Adapters
const whatsapp_adapter_1 = require("./adapters/whatsapp.adapter");
const instagram_adapter_1 = require("./adapters/instagram.adapter");
// Gateways
const gateways_1 = require("./gateways");
// Services
const services_1 = require("./services");
// Controllers
const controllers_1 = require("./controllers");
// Interfaces
const interfaces_1 = require("./interfaces");
/**
 * Omnichannel 모듈
 *
 * WhatsApp, Instagram, LINE 등 다양한 메시징 채널을 통합 관리하는 NestJS 모듈
 *
 * @example
 * // 동기 설정
 * OmnichannelModule.forRoot({
 *   twilio: {
 *     accountSid: 'AC...',
 *     authToken: '...',
 *     whatsappNumber: '+1234567890',
 *   },
 *   enableWebSocket: true,
 * })
 *
 * @example
 * // 비동기 설정 (ConfigService 사용)
 * OmnichannelModule.forRootAsync({
 *   imports: [ConfigModule],
 *   useFactory: (config: ConfigService) => ({
 *     twilio: {
 *       accountSid: config.get('TWILIO_ACCOUNT_SID'),
 *       authToken: config.get('TWILIO_AUTH_TOKEN'),
 *       whatsappNumber: config.get('TWILIO_WHATSAPP_NUMBER'),
 *     },
 *     appUrl: config.get('APP_URL'),
 *   }),
 *   inject: [ConfigService],
 * })
 */
let OmnichannelModule = OmnichannelModule_1 = class OmnichannelModule {
    /**
     * 동기 모듈 설정
     */
    static forRoot(options = {}) {
        const providers = this.createProviders(options);
        const controllers = this.createControllers(options);
        return {
            module: OmnichannelModule_1,
            imports: [
                typeorm_1.TypeOrmModule.forFeature([
                    entities_1.Conversation,
                    entities_1.Message,
                    entities_1.ContactChannel,
                    entities_1.QuickReply,
                ]),
            ],
            controllers,
            providers: [
                {
                    provide: interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
                    useValue: options,
                },
                ...providers,
            ],
            exports: [
                interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
                services_1.ConversationService,
                services_1.MessageService,
                services_1.WebhookService,
                services_1.QuickReplyService,
                whatsapp_adapter_1.WhatsAppAdapter,
                instagram_adapter_1.InstagramAdapter,
                ...(options.enableWebSocket !== false ? [gateways_1.OmnichannelGateway] : []),
            ],
        };
    }
    /**
     * 비동기 모듈 설정
     */
    static forRootAsync(options) {
        const asyncProviders = this.createAsyncProviders(options);
        return {
            module: OmnichannelModule_1,
            imports: [
                typeorm_1.TypeOrmModule.forFeature([
                    entities_1.Conversation,
                    entities_1.Message,
                    entities_1.ContactChannel,
                    entities_1.QuickReply,
                ]),
                ...(options.imports ?? []),
            ],
            controllers: [
                controllers_1.ConversationController,
                controllers_1.WebhookController,
                controllers_1.QuickReplyController,
            ],
            providers: [
                ...asyncProviders,
                whatsapp_adapter_1.WhatsAppAdapter,
                instagram_adapter_1.InstagramAdapter,
                gateways_1.OmnichannelGateway,
                services_1.ConversationService,
                services_1.MessageService,
                services_1.WebhookService,
                services_1.QuickReplyService,
            ],
            exports: [
                interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
                services_1.ConversationService,
                services_1.MessageService,
                services_1.WebhookService,
                services_1.QuickReplyService,
                whatsapp_adapter_1.WhatsAppAdapter,
                instagram_adapter_1.InstagramAdapter,
                gateways_1.OmnichannelGateway,
            ],
        };
    }
    /**
     * 프로바이더 생성
     */
    static createProviders(options) {
        const providers = [
            whatsapp_adapter_1.WhatsAppAdapter,
            instagram_adapter_1.InstagramAdapter,
            services_1.ConversationService,
            services_1.MessageService,
            services_1.WebhookService,
            services_1.QuickReplyService,
        ];
        // WebSocket 게이트웨이 (기본값: 활성화)
        if (options.enableWebSocket !== false) {
            providers.push(gateways_1.OmnichannelGateway);
        }
        return providers;
    }
    /**
     * 컨트롤러 생성
     */
    static createControllers(options) {
        // 컨트롤러 비활성화 옵션
        if (options.enableControllers === false) {
            return [];
        }
        return [controllers_1.ConversationController, controllers_1.WebhookController, controllers_1.QuickReplyController];
    }
    /**
     * 비동기 프로바이더 생성
     */
    static createAsyncProviders(options) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        if (options.useClass) {
            return [
                this.createAsyncOptionsProvider(options),
                {
                    provide: options.useClass,
                    useClass: options.useClass,
                },
            ];
        }
        return [];
    }
    /**
     * 비동기 옵션 프로바이더 생성
     */
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject ?? [],
            };
        }
        const inject = options.useExisting ?? options.useClass;
        if (!inject) {
            throw new Error('Invalid OmnichannelModuleAsyncOptions: must provide useFactory, useExisting, or useClass');
        }
        return {
            provide: interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
            useFactory: async (optionsFactory) => optionsFactory.createOmnichannelOptions(),
            inject: [inject],
        };
    }
};
exports.OmnichannelModule = OmnichannelModule;
exports.OmnichannelModule = OmnichannelModule = OmnichannelModule_1 = __decorate([
    (0, common_1.Module)({})
], OmnichannelModule);
//# sourceMappingURL=omnichannel.module.js.map