import type { ChannelAdapter, AdapterCredentialsOverride } from './channel.adapter.interface';
import type { MessageContent, SendMessageResult, NormalizedWebhookEvent, NormalizedMessage, ChannelType } from '../types';
import { type OmnichannelModuleOptions } from '../interfaces';
export declare class InstagramAdapter implements ChannelAdapter {
    private readonly options?;
    private readonly logger;
    private readonly accessToken;
    private readonly appSecret;
    private readonly webhookVerifyToken;
    private readonly pageId;
    private readonly instagramBusinessAccountId;
    private readonly apiVersion;
    private readonly igBaseUrl;
    readonly channel: ChannelType;
    constructor(options?: OmnichannelModuleOptions | undefined);
    /**
     * Resolve credentials: override가 있으면 override 사용, 없으면 기본값 사용
     */
    private resolveCredentials;
    /**
     * Send a message via Instagram Messaging API (using Facebook Graph API)
     * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
     */
    sendMessage(to: string, content: MessageContent, credentials?: AdapterCredentialsOverride): Promise<SendMessageResult>;
    /**
     * Send a template message (Instagram generic template)
     * Note: Instagram has limited template support compared to Messenger
     */
    sendTemplateMessage(to: string, templateId: string, variables: Record<string, string>, credentials?: AdapterCredentialsOverride): Promise<SendMessageResult>;
    /**
     * Parse Instagram webhook payload into normalized event
     */
    parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null;
    /**
     * Fetch messages from Instagram conversation
     * Uses Facebook Graph API for Instagram messaging
     */
    fetchMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<NormalizedMessage[]>;
    /**
     * Verify webhook subscription
     */
    verifyWebhook(token: string): boolean;
    /**
     * Fetch Instagram user profile (username, name)
     * 1차: 직접 IGSID 프로필 조회 (graph.instagram.com)
     * 2차: Conversations API 참가자 정보 조회 (fallback)
     */
    fetchUserProfile(userId: string, credentials?: AdapterCredentialsOverride): Promise<{
        id: string;
        username?: string;
        name?: string;
        profile_picture_url?: string;
    } | null>;
    /**
     * 직접 IGSID 프로필 조회 (graph.instagram.com)
     */
    private directProfileLookup;
    /**
     * Conversations API를 통한 참가자 프로필 조회 (fallback)
     * 직접 IGSID 조회 실패 시, 메시징 컨텍스트 내 참가자 정보로 프로필을 가져옴
     */
    private conversationParticipantLookup;
    /**
     * Build message payload based on content type
     */
    private buildMessagePayload;
    /**
     * Parse individual messaging event
     * @param event - The messaging event from webhook
     * @param entryId - The entry ID (Instagram Business Account ID from webhook)
     */
    private parseMessagingEvent;
    /**
     * Determine content type from message
     */
    private determineContentType;
    /**
     * Extract media URL from message attachments
     */
    private extractMediaUrl;
    /**
     * Build conversation ID from contact (customer) identifier
     */
    private buildConversationId;
    /**
     * Determine message direction based on sender ID
     * Compares against configured Instagram Business Account ID
     */
    private determineDirectionById;
}
//# sourceMappingURL=instagram.adapter.d.ts.map