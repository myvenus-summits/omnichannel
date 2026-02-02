# @myvenus-summits/omnichannel

NestJS용 옴니채널 메시징 모듈입니다. WhatsApp, Instagram DM 등 다양한 채널을 통합 관리합니다.

> **v1.0.0 Breaking Change:** 모든 TypeORM 엔티티가 제거되었습니다. 이제 인터페이스 기반으로 동작하며, Repository를 직접 구현하여 주입해야 합니다.

## 목차

- [설치](#설치)
- [빠른 시작](#빠른-시작)
- [상세 연동 가이드](#상세-연동-가이드)
  - [1. 엔티티 정의](#1-엔티티-정의)
  - [2. Repository 구현](#2-repository-구현)
  - [3. 모듈 등록](#3-모듈-등록)
  - [4. 환경변수 설정](#4-환경변수-설정)
  - [5. Webhook 설정](#5-webhook-설정)
- [API 레퍼런스](#api-레퍼런스)
- [인터페이스](#인터페이스)
- [채널별 기능](#채널별-기능)
- [문제 해결](#문제-해결-troubleshooting)
- [마이그레이션 가이드](#마이그레이션-가이드-v0x--v10)

---

## 설치

```bash
npm install github:myvenus-summits/omnichannel
```

### Peer Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/config @nestjs/swagger \
  @nestjs/websockets @nestjs/platform-socket.io \
  class-validator class-transformer reflect-metadata rxjs socket.io
```

---

## 빠른 시작

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmnichannelModule } from '@myvenus-summits/omnichannel';

import { ConversationEntity, MessageEntity, QuickReplyEntity } from './entities';
import {
  TypeOrmConversationRepository,
  TypeOrmMessageRepository,
  TypeOrmQuickReplyRepository,
} from './repositories';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([ConversationEntity, MessageEntity, QuickReplyEntity]),
    
    OmnichannelModule.forRootAsync({
      imports: [
        ConfigModule,
        TypeOrmModule.forFeature([ConversationEntity, MessageEntity, QuickReplyEntity]),
      ],
      extraProviders: [
        TypeOrmConversationRepository,
        TypeOrmMessageRepository,
        TypeOrmQuickReplyRepository,
      ],
      useFactory: (
        config: ConfigService,
        conversationRepo: TypeOrmConversationRepository,
        messageRepo: TypeOrmMessageRepository,
        quickReplyRepo: TypeOrmQuickReplyRepository,
      ) => ({
        repositories: {
          conversationRepository: conversationRepo,
          messageRepository: messageRepo,
          quickReplyRepository: quickReplyRepo,
        },
        twilio: {
          accountSid: config.get('TWILIO_ACCOUNT_SID')!,
          authToken: config.get('TWILIO_AUTH_TOKEN')!,
          whatsappNumber: config.get('TWILIO_WHATSAPP_NUMBER'),
        },
        meta: {
          appId: config.get('META_APP_ID')!,
          appSecret: config.get('META_APP_SECRET')!,
          accessToken: config.get('META_ACCESS_TOKEN')!,
          webhookVerifyToken: config.get('META_WEBHOOK_VERIFY_TOKEN')!,
        },
        appUrl: config.get('APP_URL'),
      }),
      inject: [
        ConfigService,
        TypeOrmConversationRepository,
        TypeOrmMessageRepository,
        TypeOrmQuickReplyRepository,
      ],
    }),
  ],
})
export class AppModule {}
```

---

## 상세 연동 가이드

### 1. 엔티티 정의

모듈에서 제공하는 인터페이스를 구현하여 엔티티를 정의합니다. TypeORM, Prisma, MikroORM 등 어떤 ORM도 사용 가능합니다.

#### Conversation 엔티티

```typescript
// entities/conversation.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IConversation } from '@myvenus-summits/omnichannel';

@Entity('omni_conversations')
@Index('idx_conversation_channel', ['channel'])
@Index('idx_conversation_status', ['status'])
@Index('idx_conversation_assigned', ['assignedUserId'])
export class ConversationEntity implements IConversation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  channel!: 'whatsapp' | 'instagram' | 'line';

  @Column({ name: 'channel_conversation_id', type: 'varchar', length: 255, unique: true })
  channelConversationId!: string;

  @Column({ name: 'contact_identifier', type: 'varchar', length: 255 })
  contactIdentifier!: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 255, nullable: true })
  contactName!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status!: 'open' | 'closed' | 'snoozed';

  @Column({ type: 'simple-array', default: '' })
  tags!: string[];

  @Column({ name: 'assigned_user_id', type: 'int', nullable: true })
  assignedUserId!: number | null;

  @Column({ name: 'unread_count', type: 'int', default: 0 })
  unreadCount!: number;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt!: Date | null;

  @Column({ name: 'last_message_preview', type: 'text', nullable: true })
  lastMessagePreview!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

#### Message 엔티티

```typescript
// entities/message.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IMessage } from '@myvenus-summits/omnichannel';
import { ConversationEntity } from './conversation.entity';

@Entity('omni_messages')
@Index('idx_message_conversation', ['conversationId'])
@Index('idx_message_channel_id', ['channelMessageId'])
export class MessageEntity implements IMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'conversation_id', type: 'bigint' })
  conversationId!: number;

  @Column({ name: 'channel_message_id', type: 'varchar', length: 255, unique: true })
  channelMessageId!: string;

  @Column({ type: 'varchar', length: 10 })
  direction!: 'inbound' | 'outbound';

  @Column({ name: 'sender_name', type: 'varchar', length: 255, nullable: true })
  senderName!: string | null;

  @Column({ name: 'sender_user_id', type: 'int', nullable: true })
  senderUserId!: number | null;

  @Column({ name: 'content_type', type: 'varchar', length: 20 })
  contentType!: 'text' | 'image' | 'video' | 'file' | 'template';

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText!: string | null;

  @Column({ name: 'content_media_url', type: 'varchar', length: 500, nullable: true })
  contentMediaUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status!: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations (optional)
  @ManyToOne(() => ConversationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: ConversationEntity;
}
```

#### QuickReply 엔티티

```typescript
// entities/quick-reply.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IQuickReply } from '@myvenus-summits/omnichannel';

@Entity('omni_quick_replies')
@Index('idx_quick_reply_shortcut', ['shortcut'], { unique: true, where: 'shortcut IS NOT NULL' })
export class QuickReplyEntity implements IQuickReply {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shortcut!: string | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

#### ContactChannel 엔티티 (선택)

```typescript
// entities/contact-channel.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IContactChannel } from '@myvenus-summits/omnichannel';

@Entity('omni_contact_channels')
@Index('idx_contact_channel_identifier', ['channel', 'channelIdentifier'], { unique: true })
export class ContactChannelEntity implements IContactChannel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'contact_id', type: 'int', nullable: true })
  contactId!: number | null;

  @Column({ type: 'varchar', length: 20 })
  channel!: 'whatsapp' | 'instagram' | 'line';

  @Column({ name: 'channel_identifier', type: 'varchar', length: 255 })
  channelIdentifier!: string;

  @Column({ name: 'channel_display_name', type: 'varchar', length: 255, nullable: true })
  channelDisplayName!: string | null;

  @Column({ name: 'channel_profile_url', type: 'varchar', length: 500, nullable: true })
  channelProfileUrl!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'last_contacted_at', type: 'timestamp', nullable: true })
  lastContactedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

### 엔티티 Index 파일

```typescript
// entities/index.ts
export { ConversationEntity } from './conversation.entity';
export { MessageEntity } from './message.entity';
export { QuickReplyEntity } from './quick-reply.entity';
export { ContactChannelEntity } from './contact-channel.entity';
```

---

### 2. Repository 구현

Repository 인터페이스를 구현하여 데이터 접근 계층을 정의합니다.

#### IConversationRepository 구현

```typescript
// repositories/conversation.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import {
  IConversationRepository,
  IConversation,
  CreateConversationData,
  UpdateConversationData,
  PaginatedResult,
} from '@myvenus-summits/omnichannel';
import { ConversationEntity } from '../entities';

@Injectable()
export class TypeOrmConversationRepository implements IConversationRepository {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly repo: Repository<ConversationEntity>,
  ) {}

  async findAll(filter: {
    channel?: string;
    status?: string;
    assignedUserId?: number;
    unassigned?: boolean;
    tags?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<IConversation>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('conv');

    if (filter.channel) {
      qb.andWhere('conv.channel = :channel', { channel: filter.channel });
    }

    if (filter.status) {
      qb.andWhere('conv.status = :status', { status: filter.status });
    }

    if (filter.assignedUserId !== undefined) {
      qb.andWhere('conv.assignedUserId = :assignedUserId', {
        assignedUserId: filter.assignedUserId,
      });
    }

    if (filter.unassigned) {
      qb.andWhere('conv.assignedUserId IS NULL');
    }

    if (filter.tags && filter.tags.length > 0) {
      // PostgreSQL array overlap 연산자 사용
      qb.andWhere('conv.tags && :tags', { tags: filter.tags });
    }

    if (filter.search) {
      qb.andWhere(
        '(conv.contactName ILIKE :search OR conv.contactIdentifier ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    qb.orderBy('conv.lastMessageAt', 'DESC', 'NULLS LAST')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<IConversation | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByChannelConversationId(
    channelConversationId: string,
  ): Promise<IConversation | null> {
    return this.repo.findOne({ where: { channelConversationId } });
  }

  async create(data: Partial<CreateConversationData>): Promise<IConversation> {
    const entity = this.repo.create({
      ...data,
      tags: data.tags ?? [],
      unreadCount: data.unreadCount ?? 0,
      status: data.status ?? 'open',
    });
    return this.repo.save(entity);
  }

  async update(id: number, data: UpdateConversationData): Promise<IConversation> {
    await this.repo.update(id, data);
    const updated = await this.findOne(id);
    if (!updated) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    return updated;
  }

  async incrementUnreadCount(id: number): Promise<void> {
    await this.repo.increment({ id }, 'unreadCount', 1);
  }

  async updateLastMessage(id: number, preview: string, timestamp: Date): Promise<void> {
    await this.repo.update(id, {
      lastMessagePreview: preview,
      lastMessageAt: timestamp,
    });
  }
}
```

#### IMessageRepository 구현

```typescript
// repositories/message.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  IMessageRepository,
  IMessage,
  CreateMessageData,
} from '@myvenus-summits/omnichannel';
import { MessageEntity } from '../entities';

@Injectable()
export class TypeOrmMessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly repo: Repository<MessageEntity>,
  ) {}

  async findByConversation(
    conversationId: number,
    options?: { limit?: number; before?: string },
  ): Promise<IMessage[]> {
    const limit = options?.limit ?? 50;

    const qb = this.repo
      .createQueryBuilder('msg')
      .where('msg.conversationId = :conversationId', { conversationId })
      .orderBy('msg.createdAt', 'DESC')
      .take(limit);

    if (options?.before) {
      // before는 channelMessageId를 기준으로 함
      const beforeMessage = await this.repo.findOne({
        where: { channelMessageId: options.before },
      });
      if (beforeMessage) {
        qb.andWhere('msg.createdAt < :beforeDate', {
          beforeDate: beforeMessage.createdAt,
        });
      }
    }

    const messages = await qb.getMany();

    // 최신순 정렬 후 시간순으로 반환
    return messages.reverse();
  }

  async findOne(id: number): Promise<IMessage | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByChannelMessageId(channelMessageId: string): Promise<IMessage | null> {
    return this.repo.findOne({ where: { channelMessageId } });
  }

  async create(data: Partial<CreateMessageData>): Promise<IMessage> {
    const entity = this.repo.create({
      ...data,
      status: data.status ?? 'sent',
    });
    return this.repo.save(entity);
  }

  async updateStatus(channelMessageId: string, status: string): Promise<void> {
    await this.repo.update(
      { channelMessageId },
      { status: status as IMessage['status'] },
    );
  }
}
```

#### IQuickReplyRepository 구현

```typescript
// repositories/quick-reply.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import {
  IQuickReplyRepository,
  IQuickReply,
  CreateQuickReplyData,
  UpdateQuickReplyData,
} from '@myvenus-summits/omnichannel';
import { QuickReplyEntity } from '../entities';

@Injectable()
export class TypeOrmQuickReplyRepository implements IQuickReplyRepository {
  constructor(
    @InjectRepository(QuickReplyEntity)
    private readonly repo: Repository<QuickReplyEntity>,
  ) {}

  async findAll(query: {
    search?: string;
    activeOnly?: boolean;
  }): Promise<IQuickReply[]> {
    const qb = this.repo.createQueryBuilder('qr');

    if (query.activeOnly) {
      qb.andWhere('qr.isActive = :isActive', { isActive: true });
    }

    if (query.search) {
      qb.andWhere(
        '(qr.title ILIKE :search OR qr.content ILIKE :search OR qr.shortcut ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('qr.usageCount', 'DESC');

    return qb.getMany();
  }

  async findOne(id: number): Promise<IQuickReply | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByShortcut(shortcut: string): Promise<IQuickReply | null> {
    return this.repo.findOne({ where: { shortcut, isActive: true } });
  }

  async create(data: Partial<CreateQuickReplyData>): Promise<IQuickReply> {
    const entity = this.repo.create({
      ...data,
      usageCount: 0,
      isActive: data.isActive ?? true,
    });
    return this.repo.save(entity);
  }

  async update(id: number, data: UpdateQuickReplyData): Promise<IQuickReply> {
    await this.repo.update(id, data);
    const updated = await this.findOne(id);
    if (!updated) {
      throw new Error(`QuickReply with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async incrementUsage(id: number): Promise<void> {
    await this.repo.increment({ id }, 'usageCount', 1);
  }
}
```

#### Repository Index 파일

```typescript
// repositories/index.ts
export { TypeOrmConversationRepository } from './conversation.repository';
export { TypeOrmMessageRepository } from './message.repository';
export { TypeOrmQuickReplyRepository } from './quick-reply.repository';
```

---

### 3. 모듈 등록

#### forRootAsync() 설정

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmnichannelModule } from '@myvenus-summits/omnichannel';

import {
  ConversationEntity,
  MessageEntity,
  QuickReplyEntity,
  ContactChannelEntity,
} from './entities';

import {
  TypeOrmConversationRepository,
  TypeOrmMessageRepository,
  TypeOrmQuickReplyRepository,
} from './repositories';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [
          ConversationEntity,
          MessageEntity,
          QuickReplyEntity,
          ContactChannelEntity,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      QuickReplyEntity,
    ]),

    OmnichannelModule.forRootAsync({
      imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
          ConversationEntity,
          MessageEntity,
          QuickReplyEntity,
        ]),
      ],
      extraProviders: [
        TypeOrmConversationRepository,
        TypeOrmMessageRepository,
        TypeOrmQuickReplyRepository,
      ],
      useFactory: (
        config: ConfigService,
        conversationRepo: TypeOrmConversationRepository,
        messageRepo: TypeOrmMessageRepository,
        quickReplyRepo: TypeOrmQuickReplyRepository,
      ) => ({
        // Repository 설정 (필수)
        repositories: {
          conversationRepository: conversationRepo,
          messageRepository: messageRepo,
          quickReplyRepository: quickReplyRepo,
        },

        // Twilio 설정 (WhatsApp용)
        twilio: {
          accountSid: config.get('TWILIO_ACCOUNT_SID')!,
          authToken: config.get('TWILIO_AUTH_TOKEN')!,
          whatsappNumber: config.get('TWILIO_WHATSAPP_NUMBER'),
          conversationsServiceSid: config.get('TWILIO_CONVERSATIONS_SERVICE_SID'),
          apiKeySid: config.get('TWILIO_API_KEY_SID'),
          apiKeySecret: config.get('TWILIO_API_KEY_SECRET'),
        },

        // Meta 설정 (Instagram용)
        meta: {
          appId: config.get('META_APP_ID')!,
          appSecret: config.get('META_APP_SECRET')!,
          accessToken: config.get('META_ACCESS_TOKEN')!,
          webhookVerifyToken: config.get('META_WEBHOOK_VERIFY_TOKEN')!,
        },

        // 애플리케이션 URL
        appUrl: config.get('APP_URL'),

        // WebSocket 게이트웨이 (기본값: true)
        enableWebSocket: true,

        // 컨트롤러 등록 (기본값: true)
        enableControllers: true,
      }),
      inject: [
        ConfigService,
        TypeOrmConversationRepository,
        TypeOrmMessageRepository,
        TypeOrmQuickReplyRepository,
      ],
    }),
  ],
})
export class AppModule {}
```

#### 컨트롤러 비활성화 후 직접 구현

```typescript
OmnichannelModule.forRootAsync({
  // ...
  useFactory: (...) => ({
    // ...
    enableControllers: false,  // 기본 컨트롤러 비활성화
  }),
}),
```

그런 다음 직접 컨트롤러를 구현하여 추가적인 인증/권한 로직을 적용할 수 있습니다:

```typescript
// custom-conversation.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConversationService } from '@myvenus-summits/omnichannel';
import { JwtAuthGuard } from './guards';

@Controller('api/conversations')
@UseGuards(JwtAuthGuard)
export class CustomConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async findAll() {
    return this.conversationService.findAll({ status: 'open' });
  }
}
```

---

### 4. 환경변수 설정

#### `.env` 파일 예시

```env
# 애플리케이션
APP_URL=https://your-app.com
NODE_ENV=development

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/myvenus

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret

# Meta (Instagram)
META_APP_ID=123456789012345
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_page_access_token
META_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token
```

#### Twilio 설정 상세

| 환경변수 | 설명 | 필수 |
|---------|------|-----|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ✅ |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp 전화번호 (예: +14155238886) | ✅ |
| `TWILIO_CONVERSATIONS_SERVICE_SID` | Conversations API Service SID | 선택 |
| `TWILIO_API_KEY_SID` | API Key SID (SDK 토큰 발급용) | 선택 |
| `TWILIO_API_KEY_SECRET` | API Key Secret | 선택 |

#### Meta 설정 상세

| 환경변수 | 설명 | 필수 |
|---------|------|-----|
| `META_APP_ID` | Meta App ID | ✅ |
| `META_APP_SECRET` | Meta App Secret | ✅ |
| `META_ACCESS_TOKEN` | Instagram 페이지 Access Token | ✅ |
| `META_WEBHOOK_VERIFY_TOKEN` | Webhook 검증용 토큰 (직접 생성) | ✅ |

---

### 5. Webhook 설정

#### Twilio Console 설정 (WhatsApp)

1. [Twilio Console](https://console.twilio.com)에 로그인

2. **Messaging > Try it out > Send a WhatsApp message** 에서 Sandbox 설정 (개발용)

3. **Messaging > Settings > WhatsApp sandbox settings** 에서:
   - **WHEN A MESSAGE COMES IN**: `https://your-app.com/webhooks/twilio`
   - **STATUS CALLBACK URL**: `https://your-app.com/webhooks/twilio`
   - HTTP Method: `POST`

4. 프로덕션의 경우 **Messaging > Senders > WhatsApp senders** 에서 비즈니스 프로필 설정

```
┌─────────────────────────────────────────────────────────────┐
│                    Twilio Console                           │
├─────────────────────────────────────────────────────────────┤
│  Messaging > Settings > WhatsApp sandbox settings           │
│                                                             │
│  WHEN A MESSAGE COMES IN                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://your-app.com/webhooks/twilio                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  STATUS CALLBACK URL                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://your-app.com/webhooks/twilio                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  HTTP Method: [POST ▼]                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Meta Developer Console 설정 (Instagram)

1. [Meta for Developers](https://developers.facebook.com)에서 앱 생성

2. **Instagram > API setup with Instagram Login** 활성화

3. **Webhooks** 추가:
   - Callback URL: `https://your-app.com/webhooks/meta`
   - Verify Token: `META_WEBHOOK_VERIFY_TOKEN` 환경변수 값과 동일하게 설정

4. 구독할 필드 선택:
   - `messages` - 메시지 수신
   - `messaging_postbacks` - 버튼 클릭
   - `message_deliveries` - 전송 확인
   - `message_reads` - 읽음 확인

5. **App Review** 를 통해 권한 승인 받기:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_messaging`

```
┌─────────────────────────────────────────────────────────────┐
│                Meta Developer Console                        │
├─────────────────────────────────────────────────────────────┤
│  Instagram > Webhooks                                        │
│                                                             │
│  Callback URL                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://your-app.com/webhooks/meta                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Verify Token                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ your_custom_verify_token                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Subscribed Fields:                                         │
│  ☑ messages                                                │
│  ☑ messaging_postbacks                                     │
│  ☑ message_deliveries                                      │
│  ☑ message_reads                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## API 레퍼런스

`enableControllers: true` (기본값) 설정 시 다음 엔드포인트가 자동 등록됩니다.

### Conversations API

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/omnichannel/conversations` | 대화 목록 조회 |
| `GET` | `/omnichannel/conversations/:id` | 대화 상세 조회 |
| `GET` | `/omnichannel/conversations/:id/messages` | 대화 메시지 조회 |
| `POST` | `/omnichannel/conversations/:id/messages` | 메시지 발송 |
| `PATCH` | `/omnichannel/conversations/:id/assign` | 담당자 배정 |
| `PATCH` | `/omnichannel/conversations/:id/tags` | 태그 수정 |
| `PATCH` | `/omnichannel/conversations/:id/status` | 상태 변경 |
| `PATCH` | `/omnichannel/conversations/:id/read` | 읽음 처리 |

#### 대화 목록 조회 파라미터

```typescript
GET /omnichannel/conversations?channel=whatsapp&status=open&page=1&limit=20
```

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `channel` | `whatsapp` \| `instagram` \| `line` | 채널 필터 |
| `status` | `open` \| `closed` \| `snoozed` | 상태 필터 |
| `assignedUserId` | `number` | 담당자 ID |
| `unassigned` | `boolean` | 미배정 대화만 |
| `tags` | `string[]` | 태그 필터 |
| `search` | `string` | 검색어 (이름, 식별자) |
| `page` | `number` | 페이지 번호 (기본값: 1) |
| `limit` | `number` | 페이지 크기 (기본값: 20) |

#### 메시지 발송 요청 본문

```typescript
POST /omnichannel/conversations/:id/messages
Content-Type: application/json

{
  "contentType": "text",
  "contentText": "안녕하세요, 문의 감사합니다."
}
```

```typescript
// 이미지 발송
{
  "contentType": "image",
  "contentMediaUrl": "https://example.com/image.jpg"
}

// 템플릿 발송 (WhatsApp HSM)
{
  "contentType": "template",
  "templateId": "welcome_template",
  "templateVariables": {
    "name": "홍길동",
    "clinic": "마이비너스"
  }
}
```

### Quick Replies API

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/omnichannel/quick-replies` | 빠른 답변 목록 |
| `POST` | `/omnichannel/quick-replies` | 빠른 답변 생성 |
| `PATCH` | `/omnichannel/quick-replies/:id` | 빠른 답변 수정 |
| `DELETE` | `/omnichannel/quick-replies/:id` | 빠른 답변 삭제 |

### Webhook Endpoints

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/webhooks/twilio` | Twilio 웹훅 수신 |
| `GET` | `/webhooks/meta` | Meta 웹훅 검증 |
| `POST` | `/webhooks/meta` | Meta 웹훅 수신 |

---

## 인터페이스

모듈에서 제공하는 모든 인터페이스입니다.

```typescript
import {
  // 엔티티 인터페이스
  IConversation,
  IMessage,
  IQuickReply,
  IContactChannel,

  // 데이터 타입
  CreateConversationData,
  UpdateConversationData,
  CreateMessageData,
  UpdateMessageData,
  CreateQuickReplyData,
  UpdateQuickReplyData,
  CreateContactChannelData,
  UpdateContactChannelData,
  PaginatedResult,

  // Repository 인터페이스
  IConversationRepository,
  IMessageRepository,
  IQuickReplyRepository,
  IContactChannelRepository,

  // Repository 토큰
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  QUICK_REPLY_REPOSITORY,
  CONTACT_CHANNEL_REPOSITORY,

  // 모듈 옵션
  OmnichannelModuleOptions,
  OmnichannelModuleAsyncOptions,
  TwilioConfig,
  MetaConfig,
  RepositoryConfig,

  // 타입
  ChannelType,          // 'whatsapp' | 'instagram' | 'line'
  ConversationStatus,   // 'open' | 'closed' | 'snoozed'
  MessageDirection,     // 'inbound' | 'outbound'
  MessageContentType,   // 'text' | 'image' | 'video' | 'file' | 'template'
  MessageStatus,        // 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  MessageContent,
  SendMessageResult,
  NormalizedMessage,
  NormalizedWebhookEvent,

  // 서비스
  ConversationService,
  MessageService,
  WebhookService,
  QuickReplyService,

  // 어댑터
  WhatsAppAdapter,
  InstagramAdapter,
  ChannelAdapter,

  // 게이트웨이
  OmnichannelGateway,
} from '@myvenus-summits/omnichannel';
```

---

## 채널별 기능

### WhatsApp (Twilio)

Twilio의 WhatsApp Business API를 사용합니다.

#### 지원 기능

| 기능 | 지원 |
|-----|-----|
| 텍스트 메시지 발송 | ✅ |
| 이미지/미디어 발송 | ✅ |
| 템플릿 메시지 (HSM) | ✅ |
| 메시지 상태 추적 | ✅ |
| 대화 이력 조회 | ✅ |
| SDK 토큰 발급 | ✅ |

#### WhatsApp 템플릿 메시지 발송

```typescript
// 24시간 세션 외에는 템플릿 메시지만 발송 가능
const result = await messageService.sendMessage(conversationId, {
  contentType: 'template',
  templateId: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Twilio Content SID
  templateVariables: {
    '1': '홍길동',     // {{1}}
    '2': '예약 확인',  // {{2}}
  },
});
```

#### Twilio Conversations SDK 연동

```typescript
// 클라이언트용 토큰 발급
const token = await whatsAppAdapter.generateAccessToken('user-identity');
```

### Instagram DM (Meta)

Meta의 Instagram Messaging API를 사용합니다.

#### 지원 기능

| 기능 | 지원 |
|-----|-----|
| 텍스트 메시지 발송 | ✅ |
| 이미지/미디어 발송 | ✅ |
| 제네릭 템플릿 | ✅ |
| 메시지 상태 추적 | ✅ |
| 읽음 확인 | ✅ |
| Quick Reply | ✅ |

#### Instagram 제약 사항

- **24시간 응답 윈도우**: 고객이 마지막으로 메시지를 보낸 후 24시간 내에만 메시지 발송 가능
- **Human Agent Tag**: 24시간 이후 메시지 발송은 특정 태그 필요 (Meta 승인 필요)
- **Private Reply**: 댓글/스토리 멘션에 대한 DM 발송 가능

#### Instagram 이미지 발송

```typescript
await messageService.sendMessage(conversationId, {
  contentType: 'image',
  contentMediaUrl: 'https://your-cdn.com/image.jpg',
});
```

---

## WebSocket 이벤트

`/omnichannel` 네임스페이스에 연결하여 실시간 업데이트를 수신합니다.

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/omnichannel');

// 특정 대화의 새 메시지
socket.on('conversation:123:message', (data) => {
  console.log('새 메시지:', data.message);
});

// 대화 업데이트 (상태, 담당자 등)
socket.on('conversation:update', (data) => {
  console.log('대화 업데이트:', data);
});

// 새 대화 생성
socket.on('conversation:created', (data) => {
  console.log('새 대화:', data.conversation);
});
```

---

## 커스텀 채널 어댑터

`ChannelAdapter` 인터페이스를 구현하여 LINE, KakaoTalk 등 다른 채널을 추가할 수 있습니다.

```typescript
import { Injectable } from '@nestjs/common';
import {
  ChannelAdapter,
  MessageContent,
  SendMessageResult,
  NormalizedWebhookEvent,
  NormalizedMessage,
  ChannelType,
} from '@myvenus-summits/omnichannel';

@Injectable()
export class LineAdapter implements ChannelAdapter {
  readonly channel: ChannelType = 'line';

  async sendMessage(to: string, content: MessageContent): Promise<SendMessageResult> {
    // LINE Messaging API 구현
    return { success: true, channelMessageId: 'line_msg_id' };
  }

  async sendTemplateMessage(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<SendMessageResult> {
    // LINE Flex Message 구현
    return { success: true, channelMessageId: 'line_template_id' };
  }

  parseWebhookPayload(payload: unknown): NormalizedWebhookEvent | null {
    // LINE webhook 파싱
    return null;
  }

  async fetchMessages(
    conversationId: string,
    options?: { limit?: number; before?: string },
  ): Promise<NormalizedMessage[]> {
    return [];
  }
}
```

---

## 문제 해결 (Troubleshooting)

### 일반적인 문제

#### "conversationRepository is required" 오류

```typescript
// ❌ 잘못된 설정
OmnichannelModule.forRootAsync({
  useFactory: (config) => ({
    twilio: { ... },
    // repositories 누락!
  }),
});

// ✅ 올바른 설정
OmnichannelModule.forRootAsync({
  extraProviders: [TypeOrmConversationRepository, ...],
  useFactory: (config, convRepo, msgRepo, qrRepo) => ({
    repositories: {
      conversationRepository: convRepo,
      messageRepository: msgRepo,
      quickReplyRepository: qrRepo,
    },
    twilio: { ... },
  }),
  inject: [ConfigService, TypeOrmConversationRepository, ...],
});
```

#### Webhook 404 오류

- Webhook URL이 올바르게 설정되었는지 확인
- `enableControllers: true` 설정 확인
- 라우트 프리픽스가 있는 경우 조정

```typescript
// Nest.js 글로벌 프리픽스 설정 시
app.setGlobalPrefix('api', {
  exclude: ['/webhooks/(.*)'],  // webhook 경로 제외
});
```

#### "Twilio client not initialized" 오류

```typescript
// .env 파일 확인
TWILIO_ACCOUNT_SID=ACxxxxxxxxx  // 'AC'로 시작해야 함
TWILIO_AUTH_TOKEN=xxxxx         // 빈 값이 아닌지 확인
```

#### Meta Webhook 검증 실패

```typescript
// 1. Verify Token 일치 확인
META_WEBHOOK_VERIFY_TOKEN=your_custom_token  // Console과 동일해야 함

// 2. HTTPS 필수
https://your-app.com/webhooks/meta  // HTTP는 동작하지 않음

// 3. 응답 형식 확인 (GET 요청에 challenge 값 반환)
```

### 성능 최적화

#### 대화 목록 쿼리 최적화

```typescript
// 인덱스 추가 (PostgreSQL)
CREATE INDEX idx_conv_status_last_msg ON omni_conversations(status, last_message_at DESC);
CREATE INDEX idx_conv_assigned_status ON omni_conversations(assigned_user_id, status);
```

#### WebSocket 연결 풀링

```typescript
// 클라이언트에서 연결 재사용
const socket = io('http://localhost:3000/omnichannel', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
});
```

---

## 마이그레이션 가이드 (v0.x → v1.0)

### 주요 변경사항

1. **TypeORM 엔티티 제거**: `OmnichannelEntities` 더 이상 존재하지 않음
2. **Repository 주입 필수**: 직접 구현한 Repository를 `forRootAsync`에서 주입
3. **인터페이스 기반**: 엔티티와 Repository 모두 인터페이스 구현 필요

### 마이그레이션 순서

#### Step 1: 기존 엔티티 임포트 제거

```typescript
// Before
import { OmnichannelModule, OmnichannelEntities } from '@myvenus-summits/omnichannel';

TypeOrmModule.forRoot({
  entities: [...OmnichannelEntities],  // 제거
});

// After
import { OmnichannelModule } from '@myvenus-summits/omnichannel';
```

#### Step 2: 엔티티 직접 정의

위 [엔티티 정의](#1-엔티티-정의) 섹션 참고

#### Step 3: Repository 구현

위 [Repository 구현](#2-repository-구현) 섹션 참고

#### Step 4: 모듈 설정 업데이트

```typescript
// Before
OmnichannelModule.forRootAsync({
  useFactory: (config) => ({
    twilio: {
      accountSid: config.get('TWILIO_ACCOUNT_SID'),
      authToken: config.get('TWILIO_AUTH_TOKEN'),
    },
  }),
  inject: [ConfigService],
});

// After
OmnichannelModule.forRootAsync({
  imports: [TypeOrmModule.forFeature([...])],
  extraProviders: [
    TypeOrmConversationRepository,
    TypeOrmMessageRepository,
    TypeOrmQuickReplyRepository,
  ],
  useFactory: (config, convRepo, msgRepo, qrRepo) => ({
    repositories: {
      conversationRepository: convRepo,
      messageRepository: msgRepo,
      quickReplyRepository: qrRepo,
    },
    twilio: {
      accountSid: config.get('TWILIO_ACCOUNT_SID'),
      authToken: config.get('TWILIO_AUTH_TOKEN'),
    },
  }),
  inject: [
    ConfigService,
    TypeOrmConversationRepository,
    TypeOrmMessageRepository,
    TypeOrmQuickReplyRepository,
  ],
});
```

#### Step 5: 데이터베이스 스키마 확인

기존 테이블과 새 엔티티의 컬럼명이 일치하는지 확인하고, 필요시 마이그레이션 스크립트 작성

```sql
-- 예: 컬럼명 변경이 필요한 경우
ALTER TABLE omni_conversations 
RENAME COLUMN channel_id TO channel_conversation_id;
```

---

## 개발

```bash
# 설치
npm install

# 빌드
npm run build

# 타입 체크
npm run typecheck

# 테스트
npm test

# 테스트 (watch 모드)
npm run test:watch

# 테스트 커버리지
npm run test:cov
```

---

## 라이선스

UNLICENSED - Proprietary
