# @myvenus-summits/omnichannel

Omnichannel messaging module for NestJS. Unified interface for WhatsApp, Instagram, LINE and more.

## 🚨 Breaking Change in v1.0.0

**v1.0.0 removes all TypeORM entities.** The module is now **interface-based** and requires you to implement and inject your own repositories.

This allows:
- Use any ORM (TypeORM, Prisma, MikroORM, etc.)
- Custom entity structures
- Full control over persistence layer

## Features

- 📱 **Multi-channel support**: WhatsApp (via Twilio), Instagram, LINE
- 🔄 **Real-time updates**: WebSocket support for live messaging
- 🔌 **Extensible**: Channel adapter interface for custom integrations
- 🏗️ **NestJS native**: Full support for Dependency Injection and modules
- 💾 **ORM-agnostic**: Bring your own repository implementation

## Installation

```bash
npm install github:myvenus-summits/omnichannel
```

### Peer Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/websockets @nestjs/platform-socket.io class-validator class-transformer
```

## Usage

### Step 1: Define Your Entities (TypeORM example)

```typescript
// entities/conversation.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IConversation } from '@myvenus-summits/omnichannel';

@Entity('omni_conversations')
export class ConversationEntity implements IConversation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  channel!: 'whatsapp' | 'instagram' | 'line';

  @Column({ name: 'channel_conversation_id', type: 'varchar', unique: true })
  channelConversationId!: string;

  // ... implement all IConversation fields
}
```

### Step 2: Implement Repositories

```typescript
// repositories/conversation.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConversationRepository, IConversation, PaginatedResult } from '@myvenus-summits/omnichannel';
import { ConversationEntity } from '../entities/conversation.entity';

@Injectable()
export class TypeOrmConversationRepository implements IConversationRepository {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly repo: Repository<ConversationEntity>,
  ) {}

  async findAll(filter: { /* ... */ }): Promise<PaginatedResult<IConversation>> {
    // Implement your query logic
  }

  async findOne(id: number): Promise<IConversation | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByChannelConversationId(channelConversationId: string): Promise<IConversation | null> {
    return this.repo.findOne({ where: { channelConversationId } });
  }

  async create(data: Partial<IConversation>): Promise<IConversation> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<IConversation>): Promise<IConversation> {
    await this.repo.update(id, data);
    return this.findOne(id) as Promise<IConversation>;
  }

  // ... implement remaining methods
}
```

### Step 3: Configure the Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OmnichannelModule } from '@myvenus-summits/omnichannel';

// Your entities
import { ConversationEntity, MessageEntity, QuickReplyEntity } from './entities';

// Your repository implementations
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

## Interfaces

The module exports these interfaces for your implementations:

```typescript
import {
  // Entity interfaces
  IConversation,
  IMessage,
  IQuickReply,
  IContactChannel,
  
  // Repository interfaces
  IConversationRepository,
  IMessageRepository,
  IQuickReplyRepository,
  IContactChannelRepository,
  
  // Data types
  CreateConversationData,
  UpdateConversationData,
  CreateMessageData,
  UpdateMessageData,
  PaginatedResult,
} from '@myvenus-summits/omnichannel';
```

## API Endpoints

When `enableControllers: true` (default), these endpoints are available:

### Conversations
- `GET /omnichannel/conversations` - List conversations
- `GET /omnichannel/conversations/:id` - Get conversation details
- `GET /omnichannel/conversations/:id/messages` - Get messages
- `POST /omnichannel/conversations/:id/messages` - Send message
- `PATCH /omnichannel/conversations/:id/assign` - Assign agent
- `PATCH /omnichannel/conversations/:id/tags` - Update tags
- `PATCH /omnichannel/conversations/:id/status` - Update status
- `PATCH /omnichannel/conversations/:id/read` - Mark as read

### Quick Replies
- `GET /omnichannel/quick-replies` - List templates
- `POST /omnichannel/quick-replies` - Create template
- `PATCH /omnichannel/quick-replies/:id` - Update template
- `DELETE /omnichannel/quick-replies/:id` - Delete template

### Webhooks
- `POST /webhooks/twilio` - Twilio webhook
- `GET /webhooks/meta` - Meta verification
- `POST /webhooks/meta` - Meta webhook

## WebSocket Events

Connect to `/omnichannel` namespace:

```typescript
const socket = io('http://localhost:3000/omnichannel');

// Listen for new messages
socket.on('conversation:123:message', (data) => {
  console.log('New message:', data.message);
});

// Listen for conversation updates
socket.on('conversation:update', (data) => {
  console.log('Conversation updated:', data);
});
```

## Extending with Custom Adapters

Implement the `ChannelAdapter` interface for custom channels:

```typescript
import { ChannelAdapter } from '@myvenus-summits/omnichannel';

@Injectable()
export class LineAdapter implements ChannelAdapter {
  readonly channel = 'line';
  
  async sendMessage(to: string, content: MessageContent) {
    // Implementation
  }
}
```

## Module Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `repositories` | `RepositoryConfig` | **Yes** | Repository implementations |
| `twilio` | `TwilioConfig` | No | Twilio API credentials |
| `meta` | `MetaConfig` | No | Meta (Instagram/Messenger) credentials |
| `appUrl` | `string` | No | Application URL for webhooks |
| `enableWebSocket` | `boolean` | No | Enable WebSocket gateway (default: true) |
| `enableControllers` | `boolean` | No | Register REST controllers (default: true) |

## Migration from v0.x

1. **Remove entity imports** - `OmnichannelEntities` no longer exists
2. **Create your own entities** - Implement `IConversation`, `IMessage`, `IQuickReply` interfaces
3. **Implement repositories** - Implement `IConversationRepository`, `IMessageRepository`, `IQuickReplyRepository`
4. **Update module config** - Add `repositories` option to module configuration

## Development

```bash
npm install
npm run build
npm run typecheck
```

## License

UNLICENSED - Proprietary
