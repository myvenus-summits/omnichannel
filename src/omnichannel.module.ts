import {
  Module,
  DynamicModule,
  Provider,
  Type,
} from '@nestjs/common';

// Adapters
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { InstagramAdapter } from './adapters/instagram.adapter';

// Gateways
import { OmnichannelGateway } from './gateways';

// Services
import {
  ConversationService,
  MessageService,
  WebhookService,
  QuickReplyService,
  TemplateService,
  ArchiveService,
  ARCHIVED_CONVERSATION_REPOSITORY,
} from './services';

import { STORAGE_ADAPTER } from './interfaces/storage.interface';

// Controllers
import {
  ConversationController,
  WebhookController,
  QuickReplyController,
  TemplateController,
} from './controllers';

// Interfaces
import {
  OMNICHANNEL_MODULE_OPTIONS,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  QUICK_REPLY_REPOSITORY,
  CONTACT_CHANNEL_REPOSITORY,
  MESSAGE_TEMPLATE_REPOSITORY,
  TEMPLATE_HISTORY_REPOSITORY,
  OmnichannelModuleOptions,
  OmnichannelModuleAsyncOptions,
  OmnichannelOptionsFactory,
} from './interfaces';

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
@Module({})
export class OmnichannelModule {
  /**
   * 동기 모듈 설정
   * Repository를 직접 제공해야 함
   */
  static forRoot(options: OmnichannelModuleOptions): DynamicModule {
    if (!options.repositories) {
      throw new Error(
        'OmnichannelModule.forRoot() requires repositories option. Use forRootAsync() with repository injection.',
      );
    }

    const repositoryProviders = this.createRepositoryProviders(options);
    const providers = this.createProviders(options);
    const controllers = this.createControllers(options);

    return {
      module: OmnichannelModule,
      controllers,
      providers: [
        {
          provide: OMNICHANNEL_MODULE_OPTIONS,
          useValue: options,
        },
        ...repositoryProviders,
        ...providers,
      ],
      exports: [
        OMNICHANNEL_MODULE_OPTIONS,
        CONVERSATION_REPOSITORY,
        MESSAGE_REPOSITORY,
        QUICK_REPLY_REPOSITORY,
        ConversationService,
        MessageService,
        WebhookService,
        QuickReplyService,
        WhatsAppAdapter,
        InstagramAdapter,
        ...(options.enableWebSocket !== false ? [OmnichannelGateway] : []),
      ],
    };
  }

  /**
   * 비동기 모듈 설정
   */
  static forRootAsync(options: OmnichannelModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: OmnichannelModule,
      imports: [...(options.imports ?? [])],
      controllers: [
        ConversationController,
        WebhookController,
        QuickReplyController,
        TemplateController,
      ],
      providers: [
        ...asyncProviders,
        // Repository providers from async options
        {
          provide: CONVERSATION_REPOSITORY,
          useFactory: (opts: OmnichannelModuleOptions) => {
            if (!opts.repositories?.conversationRepository) {
              throw new Error('conversationRepository is required in OmnichannelModuleOptions.repositories');
            }
            return opts.repositories.conversationRepository;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        {
          provide: MESSAGE_REPOSITORY,
          useFactory: (opts: OmnichannelModuleOptions) => {
            if (!opts.repositories?.messageRepository) {
              throw new Error('messageRepository is required in OmnichannelModuleOptions.repositories');
            }
            return opts.repositories.messageRepository;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        {
          provide: QUICK_REPLY_REPOSITORY,
          useFactory: (opts: OmnichannelModuleOptions) => {
            if (!opts.repositories?.quickReplyRepository) {
              throw new Error('quickReplyRepository is required in OmnichannelModuleOptions.repositories');
            }
            return opts.repositories.quickReplyRepository;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        {
          provide: CONTACT_CHANNEL_REPOSITORY,
          useFactory: (opts: OmnichannelModuleOptions) => {
            return opts.repositories?.contactChannelRepository ?? null;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        {
          provide: MESSAGE_TEMPLATE_REPOSITORY,
          useFactory: (opts: OmnichannelModuleOptions) => {
            return opts.repositories?.messageTemplateRepository ?? null;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        {
          provide: TEMPLATE_HISTORY_REPOSITORY,
          useFactory: (opts: OmnichannelModuleOptions) => {
            return opts.repositories?.templateHistoryRepository ?? null;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        // Storage adapter (optional, for archive feature)
        {
          provide: STORAGE_ADAPTER,
          useFactory: (opts: OmnichannelModuleOptions) => {
            return opts.storageAdapter ?? null;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        // Archived conversation repository (optional)
        {
          provide: ARCHIVED_CONVERSATION_REPOSITORY,
          useFactory: (opts: OmnichannelModuleOptions) => {
            return opts.repositories?.archivedConversationRepository ?? null;
          },
          inject: [OMNICHANNEL_MODULE_OPTIONS],
        },
        WhatsAppAdapter,
        InstagramAdapter,
        OmnichannelGateway,
        ConversationService,
        MessageService,
        WebhookService,
        QuickReplyService,
        TemplateService,
        ArchiveService,
        ...(options.extraProviders ?? []),
      ],
      exports: [
        OMNICHANNEL_MODULE_OPTIONS,
        CONVERSATION_REPOSITORY,
        MESSAGE_REPOSITORY,
        QUICK_REPLY_REPOSITORY,
        CONTACT_CHANNEL_REPOSITORY,
        MESSAGE_TEMPLATE_REPOSITORY,
        TEMPLATE_HISTORY_REPOSITORY,
        STORAGE_ADAPTER,
        ARCHIVED_CONVERSATION_REPOSITORY,
        ConversationService,
        MessageService,
        WebhookService,
        QuickReplyService,
        TemplateService,
        ArchiveService,
        WhatsAppAdapter,
        InstagramAdapter,
        OmnichannelGateway,
      ],
    };
  }

  /**
   * Repository 프로바이더 생성
   */
  private static createRepositoryProviders(
    options: OmnichannelModuleOptions,
  ): Provider[] {
    const providers: Provider[] = [];

    if (options.repositories) {
      providers.push({
        provide: CONVERSATION_REPOSITORY,
        useValue: options.repositories.conversationRepository,
      });
      providers.push({
        provide: MESSAGE_REPOSITORY,
        useValue: options.repositories.messageRepository,
      });
      providers.push({
        provide: QUICK_REPLY_REPOSITORY,
        useValue: options.repositories.quickReplyRepository,
      });
      if (options.repositories.contactChannelRepository) {
        providers.push({
          provide: CONTACT_CHANNEL_REPOSITORY,
          useValue: options.repositories.contactChannelRepository,
        });
      }
    }

    return providers;
  }

  /**
   * 프로바이더 생성
   */
  private static createProviders(
    options: OmnichannelModuleOptions,
  ): Provider[] {
    const providers: Provider[] = [
      WhatsAppAdapter,
      InstagramAdapter,
      ConversationService,
      MessageService,
      WebhookService,
      QuickReplyService,
    ];

    // WebSocket 게이트웨이 (기본값: 활성화)
    if (options.enableWebSocket !== false) {
      providers.push(OmnichannelGateway);
    }

    return providers;
  }

  /**
   * 컨트롤러 생성
   */
  private static createControllers(
    options: OmnichannelModuleOptions,
  ): Type<unknown>[] {
    // 컨트롤러 비활성화 옵션
    if (options.enableControllers === false) {
      return [];
    }

    return [ConversationController, WebhookController, QuickReplyController];
  }

  /**
   * 비동기 프로바이더 생성
   */
  private static createAsyncProviders(
    options: OmnichannelModuleAsyncOptions,
  ): Provider[] {
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
  private static createAsyncOptionsProvider(
    options: OmnichannelModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: OMNICHANNEL_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      };
    }

    const inject = options.useExisting ?? options.useClass;

    if (!inject) {
      throw new Error(
        'Invalid OmnichannelModuleAsyncOptions: must provide useFactory, useExisting, or useClass',
      );
    }

    return {
      provide: OMNICHANNEL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: OmnichannelOptionsFactory) =>
        optionsFactory.createOmnichannelOptions(),
      inject: [inject],
    };
  }
}
