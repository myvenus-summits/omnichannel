import type { ChannelType } from '../types';
/**
 * ContactChannel 인터페이스
 * 고객-채널 연결 정보
 */
export interface IContactChannel {
    id: number;
    contactId: number | null;
    channel: ChannelType;
    channelIdentifier: string;
    channelDisplayName: string | null;
    channelProfileUrl: string | null;
    metadata: Record<string, unknown> | null;
    lastContactedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * ContactChannel 생성용 데이터
 */
export type CreateContactChannelData = Omit<IContactChannel, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: number;
    createdAt?: Date;
    updatedAt?: Date;
};
/**
 * ContactChannel 업데이트용 데이터
 */
export type UpdateContactChannelData = Partial<Omit<IContactChannel, 'id' | 'createdAt'>>;
//# sourceMappingURL=contact-channel.interface.d.ts.map