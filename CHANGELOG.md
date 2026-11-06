# Changelog

All notable changes to this project will be documented in this file.

## [1.10.4] - 2026-11-06

### Fixed

- WhatsApp: `ReferralNumMedia` 만 있는 웹훅(광고가 아닌 메시지에도 `'0'` 으로 온다)은 referral 을 만들지 않는다. 광고 referral 에는 `numMedia` 를 그대로 둔다. (MD-775)
- 인바운드 referral 을 대화로 옮기는 규칙: 대화 referral 이 비어 있거나 `{ numMedia }` 뿐이면 채운다. 광고가 아닌 referral(게시물·wa.me 링크)은 뒤에 온 광고 referral 로 바꾼다. 광고 referral 끼리는 계속 첫 유입을 유지한다. 채널을 가리지 않는다 — Instagram 의 ig.me 링크(`SHORTLINK`) referral 도 뒤의 IG 광고로 바뀐다. (MD-775)

### 소비처가 알아야 할 것

- 대화 referral 의 뜻이 「첫 referral 인바운드(≈ 첫 메시지)」에서 「첫 광고 클릭(없으면 첫 비광고 referral)」로 바뀐다. 대화를 시작한 지 며칠 뒤에 광고를 누른 대화도 광고 referral 을 갖게 된다. 그래서 첫 메시지 시각으로 주를 정하고 대화 referral 로 광고 여부를 가르는 집계는, 지난 주를 다시 계산하면 값이 달라진다.
- 교체는 기존 대화의 나중 인바운드에서 `conversationRepository.update` 로 일어난다. 새 대화 이벤트(`onNewInboundConversation`)는 다시 발생하지 않는다.

### Added

- `isAdReferral(referral)` · `shouldReplaceConversationReferral(existing, incoming)` export. 광고 판정은 `ctwaClid` · `sourceId` 중 하나가 있거나 `sourceType` 이 `ad`/`ads` 인 것이다. 소비 서비스가 직접 쓰는 랜딩 referral(`sourceType: 'landing'` + `sourceId`)도 광고로 보고 보호한다.

## [1.9.0] - 2026-06-02

### Added

- `OmnichannelGateway.emitNewMessage` socket payload now includes `senderUserId`, so subscribers can distinguish sender identity (e.g., AI bot vs human staff) without a follow-up REST fetch.

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
