import type { ChatMemberUser } from '~/infrastructure/database/selects/chat.types';

import type { ChatMemberResponse } from '../responses/chat-member.response';

export function toChatMemberResponse(user: ChatMemberUser): ChatMemberResponse {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
    };
}
