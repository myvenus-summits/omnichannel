import { WebhookService } from './webhook.service';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import type { InstagramAdapter } from '../adapters/instagram.adapter';
import type { OmnichannelGateway } from '../gateways/omnichannel.gateway';
import type { ConversationService } from './conversation.service';
import type { MessageService } from './message.service';
import type { IConversation, IConversationRepository, IMessageRepository } from '../interfaces';

/**
 * 실제 WhatsApp 어댑터 → WebhookService → 저장소 update 까지 이어서 본다(MD-775).
 * 단위 테스트는 어댑터와 서비스를 따로 맞추므로, 둘의 합성이 틀려도 초록불일 수 있다.
 */
describe('Twilio referral → 대화 referral (어댑터 + 서비스)', () => {
  const conversationRepository = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByChannelConversationId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    assignIfUnassigned: jest.fn(),
    incrementUnreadCount: jest.fn(),
    updateLastMessage: jest.fn(),
  } as unknown as jest.Mocked<IConversationRepository>;
  const messageRepository = {
    findByConversation: jest.fn(),
    findOne: jest.fn(),
    findByChannelMessageId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<IMessageRepository>;

  const basePayload = {
    SmsMessageSid: 'SMflow1',
    MessageSid: 'SMflow1',
    From: 'whatsapp:+6281234567890',
    To: 'whatsapp:+14155551234',
    WaId: '6281234567890',
    ProfileName: 'Rina',
    Body: 'Halo kak',
    NumMedia: '0',
  };

  let service: WebhookService;

  const existing = (metadata: Record<string, unknown> | null): IConversation => ({
    id: 42,
    channel: 'whatsapp',
    channelConversationId: 'whatsapp:+6281234567890',
    contactIdentifier: '+6281234567890',
    contactName: 'Rina',
    status: 'open',
    tags: [],
    assignedUserId: null,
    unreadCount: 0,
    lastMessageAt: null,
    lastMessagePreview: null,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const run = async (payload: Record<string, unknown>, conversationMetadata: Record<string, unknown> | null) => {
    const conversation = existing(conversationMetadata);
    conversationRepository.findByChannelConversationId.mockResolvedValue(conversation);
    conversationRepository.update.mockResolvedValue(conversation);
    messageRepository.findByChannelMessageId.mockResolvedValue(null);
    messageRepository.create.mockImplementation(async (data) => ({ id: 1, ...data }) as never);

    await service.handleTwilioWebhook(payload);

    const created = messageRepository.create.mock.calls[0]?.[0];
    const convUpdate = conversationRepository.update.mock.calls.find(([id]) => id === 42)?.[1];
    return { created, convUpdate };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WebhookService(
      undefined,
      conversationRepository,
      messageRepository,
      undefined,
      new WhatsAppAdapter(undefined),
      {} as InstagramAdapter,
      { emitNewMessage: jest.fn(), emitConversationUpdate: jest.fn() } as unknown as OmnichannelGateway,
      {} as ConversationService,
      {} as MessageService,
    );
  });

  it('ReferralNumMedia 만 오면 메시지·대화 어디에도 referral 이 생기지 않는다', async () => {
    const { created, convUpdate } = await run({ ...basePayload, ReferralNumMedia: '0' }, null);

    expect(created?.metadata).not.toHaveProperty('referral');
    expect(convUpdate).toBeDefined();
    expect(convUpdate).not.toHaveProperty('metadata');
  });

  it('{numMedia} 가 앉아 있던 대화에 광고 클릭이 오면 광고 referral 로 바뀐다(numMedia 유지)', async () => {
    const { convUpdate } = await run(
      {
        ...basePayload,
        ReferralCtwaClid: 'ARclidflow',
        ReferralSourceId: '120209000000007',
        ReferralSourceType: 'ad',
        ReferralNumMedia: '0',
      },
      { referral: { numMedia: '0' }, inflowSource: 'keep' },
    );

    expect(convUpdate?.metadata).toEqual({
      inflowSource: 'keep',
      referral: { ctwaClid: 'ARclidflow', sourceId: '120209000000007', sourceType: 'ad', numMedia: '0' },
    });
  });

  it('호스트가 쓴 랜딩 referral 은 뒤의 CTWA 클릭으로 덮지 않는다', async () => {
    const { convUpdate } = await run(
      { ...basePayload, ReferralCtwaClid: 'ARclidflow', ReferralSourceId: '120209000000008', ReferralSourceType: 'ad' },
      { referral: { sourceId: '120209000000009', sourceType: 'landing' } },
    );

    expect(convUpdate).toBeDefined();
    expect(convUpdate).not.toHaveProperty('metadata');
  });
});
