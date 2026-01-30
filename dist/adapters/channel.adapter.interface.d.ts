import type { MessageContent, SendMessageResult, NormalizedWebhookEvent, NormalizedMessage, ChannelType } from '../types';
/**
 * Channel Adapter Interface
 * 각 메시징 채널(WhatsApp, Instagram, LINE 등)에서 구현해야 하는 인터페이스
 */
export interface ChannelAdapter {
    readonly channel: ChannelType;
    /**
     * 메시지 발송
     * @param to 수신자 식별자 (전화번호, 사용자명 등)
     * @param content 메시지 내용
     */
    sendMessage(to: string, content: MessageContent): Promise<SendMessageResult>;
    /**
     * 템플릿 메시지 발송 (WhatsApp HSM 등)
     * @param to 수신자 식별자
     * @param templateId 템플릿 ID
     * @param variables 템플릿 변수
     */
    sendTemplateMessage(to: string, templateId: string, variables: Record<string, string>): Promise<SendMessageResult>;
    /**
     * Webhook 페이로드 파싱
     * @param payload 원본 webhook 페이로드
     */
    parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null;
    /**
     * 대화 이력 조회 (채널 API에서)
     * @param conversationId 채널 대화 ID
     * @param options 조회 옵션
     */
    fetchMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<NormalizedMessage[]>;
    /**
     * 접근 토큰 발급 (SDK용, 선택적)
     * @param identity 사용자 식별자
     */
    generateAccessToken?(identity: string): Promise<string>;
    /**
     * Webhook 검증 (Meta Verify Token 등)
     * @param token 검증 토큰
     */
    verifyWebhook?(token: string): boolean;
}
export declare const CHANNEL_ADAPTER: unique symbol;
//# sourceMappingURL=channel.adapter.interface.d.ts.map