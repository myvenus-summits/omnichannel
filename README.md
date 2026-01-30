# @summits/omnichannel

Omnichannel messaging module for NestJS. Unified interface for WhatsApp, Instagram, LINE and more.

## Features

- 📱 **Multi-channel support**: WhatsApp (via Twilio), Instagram, LINE
- 🔄 **Real-time updates**: WebSocket support for live messaging
- 💾 **Persistence**: TypeORM entities for conversations and messages
- 🔌 **Extensible**: Channel adapter interface for custom integrations
- 🏗️ **NestJS native**: Full support for Dependency Injection and modules

## Installation

```bash
npm install @summits/omnichannel
```

### Peer Dependencies

Make sure you have these packages installed:

```bash
npm install @nestjs/common @nestjs/core @nestjs/typeorm @nestjs/websockets @nestjs/platform-socket.io typeorm class-validator class-transformer
```

## Usage

### Basic Setup (Synchronous)

```typescript
import { Module } from '@nestjs/common';
import { OmnichannelModule } from '@summits/omnichannel';

@Module({
  imports: [
    OmnichannelModule.forRoot({
      twilio: {
        accountSid: 'ACxxxxx',
        authToken: 'your-auth-token',
        whatsappNumber: '+1234567890',
        conversationsServiceSid: 'ISxxxxx', // optional
      },
      appUrl: 'https://your-app.com',
      enableWebSocket: true,
      enableControllers: true,
    }),
  ],
})
export class AppModule {}
```

### Async Setup (with ConfigService)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OmnichannelModule } from '@summits/omnichannel';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OmnichannelModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        twilio: {
          accountSid: config.get('TWILIO_ACCOUNT_SID'),
          authToken: config.get('TWILIO_AUTH_TOKEN'),
          whatsappNumber: config.get('TWILIO_WHATSAPP_NUMBER'),
          conversationsServiceSid: config.get('TWILIO_CONVERSATIONS_SERVICE_SID'),
        },
        meta: {
          appId: config.get('META_APP_ID'),
          appSecret: config.get('META_APP_SECRET'),
          accessToken: config.get('META_ACCESS_TOKEN'),
          webhookVerifyToken: config.get('META_WEBHOOK_VERIFY_TOKEN'),
        },
        appUrl: config.get('APP_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## TypeORM Integration

The module exports entities that you need to include in your TypeORM configuration:

```typescript
import { OmnichannelEntities } from '@summits/omnichannel';

TypeOrmModule.forRoot({
  // ... your config
  entities: [...OmnichannelEntities],
  // or use autoLoadEntities: true
});
```

### Database Tables

The module creates these tables:
- `omni_conversations` - Conversation threads
- `omni_messages` - Individual messages
- `omni_contact_channels` - Contact-channel mappings
- `omni_quick_replies` - Quick reply templates

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
- `GET /omnichannel/quick-replies/:id` - Get template
- `POST /omnichannel/quick-replies` - Create template
- `PATCH /omnichannel/quick-replies/:id` - Update template
- `DELETE /omnichannel/quick-replies/:id` - Delete template
- `POST /omnichannel/quick-replies/:id/use` - Increment usage count

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
import { ChannelAdapter } from '@summits/omnichannel';

@Injectable()
export class LineAdapter implements ChannelAdapter {
  readonly channel = 'line';
  
  async sendMessage(to: string, content: MessageContent) {
    // Implementation
  }
  
  // ... other methods
}
```

## Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `twilio` | `TwilioConfig` | - | Twilio API credentials |
| `meta` | `MetaConfig` | - | Meta (Instagram/Messenger) credentials |
| `appUrl` | `string` | - | Application URL for webhooks |
| `enableWebSocket` | `boolean` | `true` | Enable WebSocket gateway |
| `enableControllers` | `boolean` | `true` | Register REST controllers |

## Publishing to GitHub Packages

1. Create a GitHub Personal Access Token with `packages:write` scope

2. Configure authentication:
```bash
# In your ~/.npmrc
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

3. Publish:
```bash
npm publish
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run build:watch

# Type check
npm run typecheck
```

## License

UNLICENSED - Proprietary
