import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { IMessage, IConversation } from '../interfaces';
export declare class OmnichannelGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    /**
     * 새 메시지 이벤트 발송
     */
    emitNewMessage(conversationId: number, message: IMessage): void;
    /**
     * 대화 목록 업데이트 (새 대화 생성 또는 메타데이터 변경)
     */
    emitConversationUpdate(conversation: IConversation): void;
    /**
     * 대화 상태 변경 알림 (open/closed/archived)
     */
    emitConversationStatusChange(conversationId: number, status: string): void;
}
//# sourceMappingURL=omnichannel.gateway.d.ts.map