import { CHAT_WS_ROOM_PREFIX } from '../chat.constants';

export function buildChatRoomName(chatId: string): string {
    return `${CHAT_WS_ROOM_PREFIX}${chatId}`;
}
