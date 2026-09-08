import type { AiConversationMessageRole } from '~/generated/prisma/enums';

import type { GenerationMessage } from '@vention/generation-contract';

export function toGenerationHistory(
    messages: Array<{
        role: AiConversationMessageRole;
        content: string;
    }>
): GenerationMessage[] {
    return messages.map((message) => ({
        role: message.role.toLowerCase() as GenerationMessage['role'],
        content: message.content,
    }));
}
