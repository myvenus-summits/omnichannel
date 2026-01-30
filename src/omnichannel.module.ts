import {
  Module,
  DynamicModule,
  Provider,
  Type,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import {
  Conversation,
  Message,
  ContactChannel,
  QuickReply,
  OmnichannelEntities,
} from './entities';

// Adapters
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';

// Gateways
import { OmnichannelGateway } from './gateways';

// Services
import {
  ConversationService,
  MessageService,
  WebhookService,
  QuickReplyService,
} from './services';

// Controllers
import {
  ConversationController,
  WebhookController,
  QuickReplyController,
} from './controllers';

// Interfaces
import {
  OMNICHANNEL_MODULE_OPTIONS,
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
@Module({})
export class OmnichannelModule {
  /**
   * 동기 모듈 설정
   */
  static forRoot(options: OmnichannelModuleOptions = {}): DynamicModule {
    const providers = this.createProviders(options);
    const controllers = this.createControllers(options);

    return {
      module: OmnichannelModule,
      imports: [
        TypeOrmModule.forFeature([
          Conversation,
          Message,
          ContactChannel,
          QuickReply,
        ]),
      ],
      controllers,
      providers: [
        {
          provide: OMNICHANNEL_MODULE_OPTIONS,
          useValue: options,
        },
        ...providers,
      ],
      exports: [
        OMNICHANNEL_MODULE_OPTIONS,
        ConversationService,
        MessageService,
        WebhookService,
        QuickReplyService,
        WhatsAppAdapter,
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
      imports: [
        TypeOrmModule.forFeature([
          Conversation,
          Message,
          ContactChannel,
          QuickReply,
        ]),
        ...(options.imports ?? []),
      ],
      controllers: [
        ConversationController,
        WebhookController,
        QuickReplyController,
      ],
      providers: [
        ...asyncProviders,
        WhatsAppAdapter,
        OmnichannelGateway,
        ConversationService,
        MessageService,
        WebhookService,
        QuickReplyService,
      ],
      exports: [
        OMNICHANNEL_MODULE_OPTIONS,
        ConversationService,
        MessageService,
        WebhookService,
        QuickReplyService,
        WhatsAppAdapter,
        OmnichannelGateway,
      ],
    };
  }

  /**
   * 프로바이더 생성
   */
  private static createProviders(
    options: OmnichannelModuleOptions,
  ): Provider[] {
    const providers: Provider[] = [
      WhatsAppAdapter,
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
