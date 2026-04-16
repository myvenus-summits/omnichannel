import { ConversationService } from './conversation.service';
import type { IConversation, IConversationRepository } from '../interfaces';

describe('ConversationService.assignIfUnassigned', () => {
  const baseConversation: IConversation = {
    id: 1,
    channel: 'whatsapp',
    channelConversationId: 'conv-1',
    contactIdentifier: '+821****5678',
    contactName: '고객',
    customerId: null,
    status: 'open',
    tags: [],
    assignedUserId: null,
    unreadCount: 0,
    lastMessageAt: null,
    lastMessagePreview: null,
    lastInboundAt: null,
    metadata: null,
    clinicId: 1,
    channelConfigId: null,
    createdAt: new Date('2026-04-15T00:00:00Z'),
    updatedAt: new Date('2026-04-15T00:00:00Z'),
  };

  let repository: jest.Mocked<IConversationRepository>;
  let service: ConversationService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByChannelConversationId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      assignIfUnassigned: jest.fn(),
      incrementUnreadCount: jest.fn(),
      updateLastMessage: jest.fn(),
    };
    service = new ConversationService(repository);

    repository.findOne.mockResolvedValue({ ...baseConversation });
    repository.assignIfUnassigned.mockResolvedValue({
      ...baseConversation,
      assignedUserId: 42,
    });
  });

  it('delegates to the repository atomic assignment method', async () => {
    const result = await service.assignIfUnassigned(1, 42);

    expect(repository.findOne).toHaveBeenCalledWith(1);
    expect(repository.assignIfUnassigned).toHaveBeenCalledWith(1, 42);
    expect(repository.update).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        assignedUserId: 42,
      }),
    );
  });

  it('throws when the repository does not provide the atomic assignment method', async () => {
    const repositoryWithoutAtomicAssign = {
      ...repository,
      assignIfUnassigned: undefined,
    } as unknown as IConversationRepository;
    const serviceWithoutAtomicAssign = new ConversationService(
      repositoryWithoutAtomicAssign,
    );

    await expect(
      serviceWithoutAtomicAssign.assignIfUnassigned(1, 42),
    ).rejects.toThrow(
      'Conversation repository must implement assignIfUnassigned for atomic assignment',
    );

    expect(repository.update).not.toHaveBeenCalled();
  });
});
