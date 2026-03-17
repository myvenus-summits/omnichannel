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
    const eventName = `conversation:${conversationId}:message`;
    const payload = {
      conversationId,
      message: {
        id: message.id,
        conversationId,
        channelMessageId: message.channelMessageId,
        direction: message.direction,
        senderName: message.senderName,
        contentType: message.contentType,
        contentText: message.contentText,
        contentMediaUrl: message.contentMediaUrl,
        status: message.status,
        createdAt: message.createdAt,
      },
    };
    
    this.logger.log(
      `📤 Emitting ${eventName}: ${JSON.stringify(payload)}`,
    );
    
    this.server.emit(eventName, payload);

    // 전역 new_message 이벤트 (CRM에서 대화 ID 모를 때 사용)
    this.server.emit('new_message', payload);
  }

  /**
   * 대화 목록 업데이트 (새 대화 생성 또는 메타데이터 변경)
   */
  emitConversationUpdate(conversation: IConversation) {
    const payload = {
      id: conversation.id,
      channel: conversation.channel,
      contactIdentifier: conversation.contactIdentifier,
      contactName: conversation.contactName,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      lastInboundAt: conversation.lastInboundAt,
      unreadCount: conversation.unreadCount,
    };
    
    this.logger.log(
      `📤 Emitting conversation:update: ${JSON.stringify(payload)}`,
    );
    
    this.server.emit('conversation:update', payload);
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

  /**
   * 메시지 리액션 이벤트 발송
   */
  emitMessageReaction(
    conversationId: number | string,
    data: {
      messageId: number | string;
      emoji: string;
      action: 'react' | 'unreact';
      reactedBy: string;
    },
  ) {
    const payload = { conversationId, ...data };

    this.logger.log(
      `📤 Emitting message:reaction: ${JSON.stringify(payload)}`,
    );

    this.server.emit('message:reaction', payload);
  }

  /**
   * 메시지 상태 변경 알림 (sent -> delivered -> read -> failed)
   */
  emitMessageStatusUpdate(
    conversationId: number,
    channelMessageId: string,
    status: string,
    errorMetadata?: { errorCode?: number; errorMessage?: string },
  ) {
    const eventName = `conversation:${conversationId}:message:status`;
    const payload = {
      conversationId,
      channelMessageId,
      status,
      ...(errorMetadata && errorMetadata),
    };
    
    this.logger.log(
      `📤 Emitting ${eventName}: ${JSON.stringify(payload)}`,
    );
    
    this.server.emit(eventName, payload);
    
    // 전역 이벤트도 발송 (대화 ID 모를 때를 위해)
    this.server.emit('message:status', payload);
  }
}
