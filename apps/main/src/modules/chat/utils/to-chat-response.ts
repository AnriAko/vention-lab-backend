import type { ChatRecord } from '~/infrastructure/database/selects/chat.types';

import type { ChatResponse } from '../responses/chat.response';
import { toChatMemberResponse } from './to-chat-member-response';

export function toChatResponse(chat: ChatRecord): ChatResponse {
    return {
        id: chat.id,
        organizationId: chat.organizationId,
        members: chat.users.map((membership) =>
            toChatMemberResponse(membership.user)
        ),
    };
}
