import {
  ModuleMetadata,
  Type,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';

/**
 * Twilio 설정
 */
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  conversationsServiceSid?: string;
  whatsappNumber?: string;
  apiKeySid?: string;
  apiKeySecret?: string;
}

/**
 * Meta (Instagram/Messenger) 설정
 */
export interface MetaConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  webhookVerifyToken: string;
}

/**
 * Omnichannel 모듈 설정 옵션
 */
export interface OmnichannelModuleOptions {
  /**
   * Twilio 설정 (WhatsApp용)
   */
  twilio?: TwilioConfig;

  /**
   * Meta 설정 (Instagram/Messenger용)
   */
  meta?: MetaConfig;

  /**
   * 애플리케이션 URL (웹훅 검증용)
   */
  appUrl?: string;

  /**
   * WebSocket 게이트웨이 활성화 여부
   * @default true
   */
  enableWebSocket?: boolean;

  /**
   * 컨트롤러 등록 여부
   * false로 설정하면 컨트롤러를 직접 등록해야 함
   * @default true
   */
  enableControllers?: boolean;
}

/**
 * 비동기 옵션 팩토리
 */
export interface OmnichannelOptionsFactory {
  createOmnichannelOptions():
    | Promise<OmnichannelModuleOptions>
    | OmnichannelModuleOptions;
}

/**
 * 비동기 모듈 옵션
 */
export interface OmnichannelModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  /**
   * useExisting: 기존 프로바이더 사용
   */
  useExisting?: Type<OmnichannelOptionsFactory>;

  /**
   * useClass: 새 인스턴스 생성
   */
  useClass?: Type<OmnichannelOptionsFactory>;

  /**
   * useFactory: 팩토리 함수 사용
   */
  useFactory?: (
    ...args: unknown[]
  ) => Promise<OmnichannelModuleOptions> | OmnichannelModuleOptions;

  /**
   * inject: 팩토리 함수에 주입할 의존성
   */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}

export const OMNICHANNEL_MODULE_OPTIONS = 'OMNICHANNEL_MODULE_OPTIONS';
