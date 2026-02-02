import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import type { MessageDirection, MessageContentType, MessageStatus } from '../types';
import { Conversation } from './conversation.entity';

@Entity('omni_messages')
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @ManyToOne('Conversation', 'messages')
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId!: number;

  @Column({ name: 'channel_message_id', type: 'varchar', length: 255, unique: true })
  channelMessageId!: string;

  @Column({ type: 'varchar', length: 10 })
  direction!: MessageDirection;

  @Column({ name: 'sender_name', type: 'varchar', length: 255, nullable: true })
  senderName!: string | null;

  @Column({ name: 'sender_user_id', type: 'bigint', nullable: true })
  senderUserId!: number | null;

  @Column({ name: 'content_type', type: 'varchar', length: 20 })
  contentType!: MessageContentType;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText!: string | null;

  @Column({ name: 'content_media_url', type: 'text', nullable: true })
  contentMediaUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status!: MessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
