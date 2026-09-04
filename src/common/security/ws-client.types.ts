import type { Socket } from 'socket.io';

import type { AuthUser } from '~/common/security/auth.types';

export type WsClientData = {
    user?: AuthUser;
};

type WsEvents = {
    [event: string]: (...args: unknown[]) => void;
};

export type WsClient = Socket<WsEvents, WsEvents, WsEvents, WsClientData>;

export type WsHandshakeClient = Pick<WsClient, 'handshake' | 'data'>;
