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
 * // 비동기 설정 (Repository 주입 필수)
 * OmnichannelModule.forRootAsync({
 *   imports: [ConfigModule, TypeOrmModule.forFeature([...])],
 *   useFactory: (
 *     config: ConfigService,
 *     conversationRepo: Repository<ConversationEntity>,
 *     messageRepo: Repository<MessageEntity>,
 *     quickReplyRepo: Repository<QuickReplyEntity>,
 *   ) => ({
 *     repositories: {
 *       conversationRepository: new TypeOrmConversationRepository(conversationRepo),
 *       messageRepository: new TypeOrmMessageRepository(messageRepo),
 *       quickReplyRepository: new TypeOrmQuickReplyRepository(quickReplyRepo),
 *     },
 *     twilio: {
 *       accountSid: config.get('TWILIO_ACCOUNT_SID'),
 *       authToken: config.get('TWILIO_AUTH_TOKEN'),
 *       whatsappNumber: config.get('TWILIO_WHATSAPP_NUMBER'),
 *     },
 *     appUrl: config.get('APP_URL'),
 *   }),
 *   inject: [ConfigService, getRepositoryToken(ConversationEntity), ...],
 * })
 */
let OmnichannelModule = OmnichannelModule_1 = class OmnichannelModule {
    /**
     * 동기 모듈 설정
     * Repository를 직접 제공해야 함
     */
    static forRoot(options) {
        if (!options.repositories) {
            throw new Error('OmnichannelModule.forRoot() requires repositories option. Use forRootAsync() with repository injection.');
        }
        const repositoryProviders = this.createRepositoryProviders(options);
        const providers = this.createProviders(options);
        const controllers = this.createControllers(options);
        return {
            module: OmnichannelModule_1,
            controllers,
            providers: [
                {
                    provide: interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
                    useValue: options,
                },
                ...repositoryProviders,
                ...providers,
            ],
            exports: [
                interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
                interfaces_1.CONVERSATION_REPOSITORY,
                interfaces_1.MESSAGE_REPOSITORY,
                interfaces_1.QUICK_REPLY_REPOSITORY,
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
            imports: [...(options.imports ?? [])],
            controllers: [
                controllers_1.ConversationController,
                controllers_1.WebhookController,
                controllers_1.QuickReplyController,
            ],
            providers: [
                ...asyncProviders,
                // Repository providers from async options
                {
                    provide: interfaces_1.CONVERSATION_REPOSITORY,
                    useFactory: (opts) => {
                        if (!opts.repositories?.conversationRepository) {
                            throw new Error('conversationRepository is required in OmnichannelModuleOptions.repositories');
                        }
                        return opts.repositories.conversationRepository;
                    },
                    inject: [interfaces_1.OMNICHANNEL_MODULE_OPTIONS],
                },
                {
                    provide: interfaces_1.MESSAGE_REPOSITORY,
                    useFactory: (opts) => {
                        if (!opts.repositories?.messageRepository) {
                            throw new Error('messageRepository is required in OmnichannelModuleOptions.repositories');
                        }
                        return opts.repositories.messageRepository;
                    },
                    inject: [interfaces_1.OMNICHANNEL_MODULE_OPTIONS],
                },
                {
                    provide: interfaces_1.QUICK_REPLY_REPOSITORY,
                    useFactory: (opts) => {
                        if (!opts.repositories?.quickReplyRepository) {
                            throw new Error('quickReplyRepository is required in OmnichannelModuleOptions.repositories');
                        }
                        return opts.repositories.quickReplyRepository;
                    },
                    inject: [interfaces_1.OMNICHANNEL_MODULE_OPTIONS],
                },
                {
                    provide: interfaces_1.CONTACT_CHANNEL_REPOSITORY,
                    useFactory: (opts) => {
                        return opts.repositories?.contactChannelRepository ?? null;
                    },
                    inject: [interfaces_1.OMNICHANNEL_MODULE_OPTIONS],
                },
                whatsapp_adapter_1.WhatsAppAdapter,
                instagram_adapter_1.InstagramAdapter,
                gateways_1.OmnichannelGateway,
                services_1.ConversationService,
                services_1.MessageService,
                services_1.WebhookService,
                services_1.QuickReplyService,
                ...(options.extraProviders ?? []),
            ],
            exports: [
                interfaces_1.OMNICHANNEL_MODULE_OPTIONS,
                interfaces_1.CONVERSATION_REPOSITORY,
                interfaces_1.MESSAGE_REPOSITORY,
                interfaces_1.QUICK_REPLY_REPOSITORY,
                interfaces_1.CONTACT_CHANNEL_REPOSITORY,
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
     * Repository 프로바이더 생성
     */
    static createRepositoryProviders(options) {
        const providers = [];
        if (options.repositories) {
            providers.push({
                provide: interfaces_1.CONVERSATION_REPOSITORY,
                useValue: options.repositories.conversationRepository,
            });
            providers.push({
                provide: interfaces_1.MESSAGE_REPOSITORY,
                useValue: options.repositories.messageRepository,
            });
            providers.push({
                provide: interfaces_1.QUICK_REPLY_REPOSITORY,
                useValue: options.repositories.quickReplyRepository,
            });
            if (options.repositories.contactChannelRepository) {
                providers.push({
                    provide: interfaces_1.CONTACT_CHANNEL_REPOSITORY,
                    useValue: options.repositories.contactChannelRepository,
                });
            }
        }
        return providers;
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