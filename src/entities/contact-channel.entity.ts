import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import type { ChannelType } from '../types';

/**
 * 고객-채널 연결 엔티티
 * 같은 고객이 여러 채널을 통해 연락할 수 있으므로
 * 고객 ID와 채널별 식별자를 연결합니다.
 */
@Entity('omni_contact_channels')
@Unique(['channel', 'channelIdentifier'])
@Index(['contactId'])
export class ContactChannel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  /**
   * 내부 고객 ID (CRM 고객 테이블과 연결)
   * nullable: 아직 매칭되지 않은 고객일 수 있음
   */
  @Column({ name: 'contact_id', type: 'bigint', nullable: true })
  contactId!: number | null;

  @Column({ type: 'varchar', length: 20 })
  channel!: ChannelType;

  /**
   * 채널별 고객 식별자
   * WhatsApp: +821012345678
   * Instagram: username
   * LINE: userId
   */
  @Column({ name: 'channel_identifier', type: 'varchar', length: 255 })
  channelIdentifier!: string;

  /**
   * 채널에서 가져온 프로필 이름
   */
  @Column({ name: 'channel_display_name', type: 'varchar', length: 255, nullable: true })
  channelDisplayName!: string | null;

  /**
   * 채널에서 가져온 프로필 이미지 URL
   */
  @Column({ name: 'channel_profile_url', type: 'text', nullable: true })
  channelProfileUrl!: string | null;

  /**
   * 채널별 추가 메타데이터
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  /**
   * 이 채널을 통한 마지막 연락 시간
   */
  @Column({ name: 'last_contacted_at', type: 'timestamptz', nullable: true })
  lastContactedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
