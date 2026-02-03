import { ModuleMetadata, Type, InjectionToken, OptionalFactoryDependency, Provider } from '@nestjs/common';
import type { IConversationRepository, IMessageRepository, IQuickReplyRepository, IContactChannelRepository } from './repository.interface';
import type { IMessageTemplateRepository, ITemplateHistoryRepository } from './message-template.interface';
import type { IStorageAdapter } from './storage.interface';
import type { IArchivedConversationRepository } from '../services/archive.service';
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
    /**
     * ArchivedConversation Repository 구현체 (선택)
     * 아카이브된 대화 목록 저장용
     */
    archivedConversationRepository?: IArchivedConversationRepository;
}
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
    /**
     * Storage adapter for archiving
     * Implement IStorageAdapter (e.g., S3StorageAdapter)
     */
    storageAdapter?: IStorageAdapter;
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