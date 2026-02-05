import type { ChannelType, ConversationStatus } from '../types';

/**
 * Conversation 인터페이스
 * 외부에서 엔티티 구조를 직접 정의하여 사용
 */
export interface IConversation {
  id: number;
  channel: ChannelType;
  channelConversationId: string;
  contactIdentifier: string;
  contactName: string | null;
  customerId?: number | null;
  status: ConversationStatus;
  tags: string[];
  assignedUserId: number | null;
  unreadCount: number;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  closedAt?: Date | null;
  archivedAt?: Date | null;
  archiveUrl?: string | null;
  metadata: Record<string, unknown> | null;

  /**
   * 병원 ID (멀티테넌트)
   * @since 1.1.0
   */
  clinicId?: number | null;

  /**
   * 지역 ID (멀티테넌트)
   * @since 1.1.0
   */
  regionId?: number | string | null;

  /**
   * 채널 설정 ID (clinic_channel_config FK)
   * @since 1.1.0
   */
  channelConfigId?: number | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversation 생성용 데이터
 */
export type CreateConversationData = Omit<IConversation, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Conversation 업데이트용 데이터
 */
export type UpdateConversationData = Partial<Omit<IConversation, 'id' | 'createdAt'>>;
