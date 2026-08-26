export const CHAT_WS_EVENTS = {
    JOIN: 'chat:join',
    JOINED: 'chat:joined',
    MESSAGE_SEND: 'chat:message:send',
    MESSAGE: 'chat:message',
    MESSAGE_ACK: 'chat:message:ack',
    TYPING: 'chat:typing',
    STOP_TYPING: 'chat:stop-typing',
    ERROR: 'chat:error',
} as const;
