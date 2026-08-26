import type { Socket } from 'socket.io';

import type { AppRole } from '~/common/security/permissions/app-role.enum';
import type { MessageResponse } from '~/modules/chat/responses/message.response';

export type ChatSocketAuth = {
    token?: string;
    organizationId?: string;
};

export type ChatSocketData = {
    userId: string;
    organizationId: string;
    role: AppRole;
};

export type ChatSocket = Socket<any, any, any, ChatSocketData>;

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
