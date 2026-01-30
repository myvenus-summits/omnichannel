import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import type { ChannelType, ConversationStatus } from '../types';

// Forward reference to avoid circular dependency
// Message entity will be imported at runtime
@Entity('omni_conversations')
@Index(['channel', 'status'])
@Index(['assignedUserId', 'status'])
@Index(['lastMessageAt'])
export class Conversation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  channel!: ChannelType;

  @Column({ name: 'channel_conversation_id', unique: true })
  channelConversationId!: string;

  @Column({ name: 'contact_identifier' })
  @Index()
  contactIdentifier!: string;

  @Column({ name: 'contact_name', nullable: true })
  contactName!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status!: ConversationStatus;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  tags!: string[];

  @Column({ name: 'assigned_user_id', nullable: true, type: 'bigint' })
  assignedUserId!: number | null;

  @Column({ name: 'unread_count', default: 0 })
  unreadCount!: number;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt!: Date | null;

  @Column({ name: 'last_message_preview', nullable: true })
  lastMessagePreview!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany('Message', 'conversation')
  messages!: import('./message.entity').Message[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
