# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-02-02

### 🚨 BREAKING CHANGES

- **Removed all TypeORM entities** - The module no longer provides entities
- **Repository injection required** - You must implement and inject your own repositories
- Removed `OmnichannelEntities` export
- Removed `@nestjs/typeorm` and `typeorm` from peer dependencies

### ✨ Added

- **Entity interfaces**: `IConversation`, `IMessage`, `IQuickReply`, `IContactChannel`
- **Repository interfaces**: `IConversationRepository`, `IMessageRepository`, `IQuickReplyRepository`, `IContactChannelRepository`
- **Type helpers**: `CreateConversationData`, `UpdateConversationData`, `CreateMessageData`, `UpdateMessageData`
- **`PaginatedResult<T>`** generic type for pagination
- **Repository injection tokens**: `CONVERSATION_REPOSITORY`, `MESSAGE_REPOSITORY`, `QUICK_REPLY_REPOSITORY`, `CONTACT_CHANNEL_REPOSITORY`
- **`extraProviders`** option in `forRootAsync()` for repository registration

### 🔄 Changed

- Services now use injected repositories instead of TypeORM repositories
- Module configuration requires `repositories` option with repository implementations
- `forRoot()` now requires `repositories` option (throws error if missing)

### 📦 Migration Guide

```typescript
// Before (v0.x)
import { OmnichannelModule, OmnichannelEntities } from '@myvenus-summits/omnichannel';

TypeOrmModule.forRoot({
  entities: [...OmnichannelEntities],
});

OmnichannelModule.forRootAsync({
  useFactory: (config) => ({
    twilio: { ... },
  }),
});

// After (v1.0)
import { 
  OmnichannelModule,
  IConversationRepository,
  IMessageRepository,
  IQuickReplyRepository,
} from '@myvenus-summits/omnichannel';

// 1. Define your own entities implementing the interfaces
// 2. Implement your own repositories

OmnichannelModule.forRootAsync({
  extraProviders: [
    YourConversationRepository,
    YourMessageRepository,
    YourQuickReplyRepository,
  ],
  useFactory: (config, convRepo, msgRepo, qrRepo) => ({
    repositories: {
      conversationRepository: convRepo,
      messageRepository: msgRepo,
      quickReplyRepository: qrRepo,
    },
    twilio: { ... },
  }),
  inject: [ConfigService, YourConversationRepository, YourMessageRepository, YourQuickReplyRepository],
});
```

## [0.3.1] - Previous release

- Last version with bundled TypeORM entities
