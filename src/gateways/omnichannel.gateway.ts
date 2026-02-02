import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type { IMessage, IConversation } from '../interfaces';

@WebSocketGateway({
  namespace: 'omnichannel',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class OmnichannelGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(OmnichannelGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 새 메시지 이벤트 발송
   */
  emitNewMessage(conversationId: number, message: IMessage) {
    this.server.emit(`conversation:${conversationId}:message`, {
      conversationId,
      message: {
        id: message.id,
        direction: message.direction,
        senderName: message.senderName,
        contentType: message.contentType,
        contentText: message.contentText,
        contentMediaUrl: message.contentMediaUrl,
        status: message.status,
        createdAt: message.createdAt,
      },
    });
    this.logger.debug(
      `Emitted new message for conversation ${conversationId}`,
    );
  }

  /**
   * 대화 목록 업데이트 (새 대화 생성 또는 메타데이터 변경)
   */
  emitConversationUpdate(conversation: IConversation) {
    this.server.emit('conversation:update', {
      id: conversation.id,
      channel: conversation.channel,
      contactIdentifier: conversation.contactIdentifier,
      contactName: conversation.contactName,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      unreadCount: conversation.unreadCount,
    });
    this.logger.debug(`Emitted conversation update for ${conversation.id}`);
  }

  /**
   * 대화 상태 변경 알림 (open/closed/archived)
   */
  emitConversationStatusChange(conversationId: number, status: string) {
    this.server.emit(`conversation:${conversationId}:status`, {
      conversationId,
      status,
    });
  }
}
