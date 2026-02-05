import { ModuleMetadata, Type, InjectionToken, OptionalFactoryDependency, Provider } from '@nestjs/common';
import type { IConversationRepository, IMessageRepository, IQuickReplyRepository, IContactChannelRepository } from './repository.interface';
import type { IMessageTemplateRepository, ITemplateHistoryRepository } from './message-template.interface';
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
    /**
     * Facebook Page ID (used for Instagram messaging endpoint)
     * This is the Page that is connected to your Instagram Business Account
     */
    pageId?: string;
    /**
     * Instagram Business Account ID (used for direction detection)
     * This is the Instagram account connected to your Facebook Page
     */
    instagramBusinessAccountId?: string;
}
/**
 * Repository 설정
 * 외부에서 Repository 구현체를 주입
 */
export interface RepositoryConfig {
    /**
     * Conversation Repository 구현체
     */
    conversationRepository: IConversationRepository;
    /**
     * Message Repository 구현체
     */
    messageRepository: IMessageRepository;
    /**
     * QuickReply Repository 구현체
     */
    quickReplyRepository: IQuickReplyRepository;
    /**
     * ContactChannel Repository 구현체 (선택)
     */
    contactChannelRepository?: IContactChannelRepository;
    /**
     * MessageTemplate Repository 구현체 (선택)
     */
    messageTemplateRepository?: IMessageTemplateRepository;
    /**
     * TemplateHistory Repository 구현체 (선택)
     */
    templateHistoryRepository?: ITemplateHistoryRepository;
}
/**
 * Channel Credentials Resolver
 * 채널 설정 ID로 동적으로 credentials를 가져오는 콜백
 * @since 1.1.0
 */
export type ChannelCredentialsResolver = (channelConfigId: number) => Promise<{
    twilio?: TwilioConfig;
    meta?: MetaConfig;
}>;
/**
 * Channel Config Resolver (webhook 수신 시 사용)
 * 수신 식별자(전화번호, IG 계정 등)로 channel config를 조회
 * @since 1.1.0
 */
export interface ResolvedChannelConfig {
    channelConfigId: number;
    clinicId: number;
    regionId?: number;
    twilio?: TwilioConfig;
    meta?: MetaConfig;
}
export type WebhookChannelResolver = (channel: string, identifier: string) => Promise<ResolvedChannelConfig | null>;
/**
 * Omnichannel 모듈 설정 옵션
 */
export interface OmnichannelModuleOptions {
    /**
     * Repository 설정
     * forRootAsync에서 주입 필수
     */
    repositories?: RepositoryConfig;
    /**
     * Twilio 설정 (WhatsApp용)
     * 싱글테넌트 또는 기본 credentials로 사용
     */
    twilio?: TwilioConfig;
    /**
     * Meta 설정 (Instagram/Messenger용)
     * 싱글테넌트 또는 기본 credentials로 사용
     */
    meta?: MetaConfig;
    /**
     * 채널 설정 ID로 동적 credentials 조회
     * 멀티테넌트 환경에서 병원별 credentials를 가져올 때 사용
     * 설정 시 twilio/meta 기본값보다 우선
     * @since 1.1.0
     */
    channelCredentialsResolver?: ChannelCredentialsResolver;
    /**
     * Webhook 수신 시 수신 식별자로 channel config 조회
     * 멀티테넌트 환경에서 webhook → clinic 매핑에 사용
     * @since 1.1.0
     */
    webhookChannelResolver?: WebhookChannelResolver;
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
    createOmnichannelOptions(): Promise<OmnichannelModuleOptions> | OmnichannelModuleOptions;
}
/**
 * 비동기 모듈 옵션
 */
export interface OmnichannelModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
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
    useFactory?: (...args: unknown[]) => Promise<OmnichannelModuleOptions> | OmnichannelModuleOptions;
    /**
     * inject: 팩토리 함수에 주입할 의존성
     */
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    /**
     * 추가 프로바이더 (Repository 구현체 등)
     */
    extraProviders?: Provider[];
}
export declare const OMNICHANNEL_MODULE_OPTIONS = "OMNICHANNEL_MODULE_OPTIONS";
//# sourceMappingURL=omnichannel-options.interface.d.ts.map