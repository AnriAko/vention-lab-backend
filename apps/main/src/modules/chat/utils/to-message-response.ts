import type { MessageRecord } from '~/infrastructure/database/selects/chat.types';

import type { MessageResponse } from '../responses/message.response';
import { toChatMemberResponse } from './to-chat-member-response';

export function toMessageResponse(message: MessageRecord): MessageResponse {
    return {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
        sender: toChatMemberResponse(message.sender),
    };
}
