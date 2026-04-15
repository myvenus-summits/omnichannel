import { MessageService } from './message.service';
import type {
  IMessageRepository,
  IMessage,
  IConversation,
  OmnichannelModuleOptions,
} from '../interfaces';

describe('MessageService auto assignment via host policy', () => {
  const mockMessageRepository: jest.Mocked<IMessageRepository> = {
    findByConversation: jest.fn(),
    findOne: jest.fn(),
    findByChannelMessageId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockWhatsAppAdapter = {
    sendMessage: jest.fn(),
    sendTemplateMessage: jest.fn(),
  };

  const mockInstagramAdapter = {
    sendMessage: jest.fn(),
    sendTemplateMessage: jest.fn(),
  };

  const mockConversationService = {
    findOne: jest.fn(),
    updateLastMessage: jest.fn(),
    incrementUnreadCount: jest.fn(),
    assignIfUnassigned: jest.fn(),
  };

  const resolveAutoAssigneeOnFirstReply = jest.fn();

  const moduleOptions: OmnichannelModuleOptions = {
    resolveAutoAssigneeOnFirstReply,
  };

  const baseConversation: IConversation = {
    id: 1,
    channel: 'whatsapp',
    channelConversationId: 'conv-1',
    contactIdentifier: '+821012345678',
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

  const savedMessage: IMessage = {
    id: 101,
    conversationId: 1,
    channelMessageId: 'msg-101',
    direction: 'outbound',
    senderName: 'Alice',
    senderUserId: 42,
    contentType: 'text',
    contentText: '안녕하세요',
    contentMediaUrl: null,
    replyToMessageId: null,
    replyToPreview: null,
    status: 'sent',
    metadata: null,
    createdAt: new Date('2026-04-15T00:01:00Z'),
  };

  let service: MessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessageService(
      mockMessageRepository,
      moduleOptions,
      mockWhatsAppAdapter as any,
      mockInstagramAdapter as any,
      mockConversationService as any,
    );

    mockConversationService.findOne.mockResolvedValue({ ...baseConversation });
    mockConversationService.updateLastMessage.mockResolvedValue(undefined);
    mockConversationService.assignIfUnassigned.mockResolvedValue({
      ...baseConversation,
      assignedUserId: 42,
    });
    mockWhatsAppAdapter.sendMessage.mockResolvedValue({
      success: true,
      channelMessageId: 'msg-101',
    });
    mockMessageRepository.create.mockResolvedValue(savedMessage);
  });

  it('auto-assigns using the host-provided resolver result', async () => {
    resolveAutoAssigneeOnFirstReply.mockResolvedValue(42);

    await service.sendMessage(
      1,
      {
        contentType: 'text',
        contentText: '안녕하세요',
      },
      42,
      'Alice',
      'LV6_FRONT',
    );

    expect(resolveAutoAssigneeOnFirstReply).toHaveBeenCalledWith({
      conversation: expect.objectContaining({ id: 1, assignedUserId: null }),
      senderUserId: 42,
      senderName: 'Alice',
      senderRole: 'LV6_FRONT',
    });
    expect(mockConversationService.assignIfUnassigned).toHaveBeenCalledWith(1, 42);
  });

  it('does not auto-assign when the resolver returns null', async () => {
    resolveAutoAssigneeOnFirstReply.mockResolvedValue(null);

    await service.sendMessage(
      1,
      {
        contentType: 'text',
        contentText: '관리자 답장',
      },
      42,
      'Alice',
      'admin',
    );

    expect(resolveAutoAssigneeOnFirstReply).toHaveBeenCalled();
    expect(mockConversationService.assignIfUnassigned).not.toHaveBeenCalled();
  });

  it('does not call the resolver when the conversation is already assigned', async () => {
    mockConversationService.findOne.mockResolvedValue({
      ...baseConversation,
      assignedUserId: 7,
    });

    await service.sendMessage(
      1,
      {
        contentType: 'text',
        contentText: '이미 담당자 있음',
      },
      42,
      'Alice',
      'LV2_MANAGER',
    );

    expect(resolveAutoAssigneeOnFirstReply).not.toHaveBeenCalled();
    expect(mockConversationService.assignIfUnassigned).not.toHaveBeenCalled();
  });
});
