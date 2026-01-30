import { DynamicModule } from '@nestjs/common';
import { OmnichannelModuleOptions, OmnichannelModuleAsyncOptions } from './interfaces';
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
export declare class OmnichannelModule {
    /**
     * 동기 모듈 설정
     */
    static forRoot(options?: OmnichannelModuleOptions): DynamicModule;
    /**
     * 비동기 모듈 설정
     */
    static forRootAsync(options: OmnichannelModuleAsyncOptions): DynamicModule;
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