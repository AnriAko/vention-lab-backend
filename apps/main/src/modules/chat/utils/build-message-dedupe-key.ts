export function buildMessageDedupeKey(params: {
    userId: string;
    chatId: string;
    clientMessageId: string;
}): string {
    return `${params.userId}:${params.chatId}:${params.clientMessageId}`;
}
