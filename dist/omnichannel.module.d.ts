import { DynamicModule } from '@nestjs/common';
import { OmnichannelModuleOptions, OmnichannelModuleAsyncOptions } from './interfaces';
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
export declare class OmnichannelModule {
    /**
     * 동기 모듈 설정
     * Repository를 직접 제공해야 함
     */
    static forRoot(options: OmnichannelModuleOptions): DynamicModule;
    /**
     * 비동기 모듈 설정
     */
    static forRootAsync(options: OmnichannelModuleAsyncOptions): DynamicModule;
    /**
     * Repository 프로바이더 생성
     */
    private static createRepositoryProviders;
    /**
     * 프로바이더 생성
     */
    private static createProviders;
    /**
     * 컨트롤러 생성
     */
    private static createControllers;
    /**
     * 비동기 프로바이더 생성
     */
    private static createAsyncProviders;
    /**
     * 비동기 옵션 프로바이더 생성
     */
    private static createAsyncOptionsProvider;
}
//# sourceMappingURL=omnichannel.module.d.ts.map