export const CHAT_WS_EVENTS = {
    READY: 'chat:ready',
    JOIN: 'chat:join',
    JOINED: 'chat:joined',
    MESSAGE_SEND: 'chat:message:send',
    MESSAGE: 'chat:message',
    MESSAGE_ACK: 'chat:message:ack',
    MESSAGE_DELETE: 'chat:message:delete',
    MESSAGE_DELETED: 'chat:message:deleted',
    TYPING: 'chat:typing',
    STOP_TYPING: 'chat:stop-typing',
    ERROR: 'chat:error',
} as const;
