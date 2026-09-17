import type { AuthUser } from '~/common/security/auth.types';
import type { WsClient } from '~/common/security/ws-client.types';
import type { MessageResponse } from '~/modules/chat/responses/message.response';

export type ChatSocketAuth = {
    token?: string;
    organizationId?: string;
    organizationRole?: string;
};

export type ChatSocketData = {
    user: AuthUser;
};

export type ChatSocket = WsClient & {
    data: ChatSocketData;
};

export type ChatRoomJoinResult = {
    ok: boolean;
    chatId: string;
};

export type ChatMessageAck = {
    chatId: string;
    clientMessageId?: string;
    duplicate: boolean;
    message: MessageResponse;
};

export type ChatTypingPayload = {
    chatId: string;
    userId: string;
};

export type ChatMessageDeletedPayload = {
    chatId: string;
    messageId: string;
};
