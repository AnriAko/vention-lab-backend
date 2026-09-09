import type { AiConversationMessageRole } from '~/generated/prisma/enums';

import { toGenerationHistory } from './ai.generation.utils';

describe('toGenerationHistory', () => {
    it('should convert conversation messages to generation history', () => {
        const messages: Array<{
            role: AiConversationMessageRole;
            content: string;
        }> = [
            {
                role: 'USER',
                content: 'Hello',
            },
            {
                role: 'ASSISTANT',
                content: 'Hello! How can I help you?',
            },
        ];

        const result = toGenerationHistory(messages);

        expect(result).toEqual([
            {
                role: 'user',
                content: 'Hello',
            },
            {
                role: 'assistant',
                content: 'Hello! How can I help you?',
            },
        ]);
    });

    it('should return an empty array when messages are empty', () => {
        const result = toGenerationHistory([]);

        expect(result).toEqual([]);
    });

    it('should preserve message order', () => {
        const messages: Array<{
            role: AiConversationMessageRole;
            content: string;
        }> = [
            {
                role: 'USER',
                content: 'First',
            },
            {
                role: 'ASSISTANT',
                content: 'Second',
            },
            {
                role: 'USER',
                content: 'Third',
            },
        ];

        const result = toGenerationHistory(messages);

        expect(result).toEqual([
            {
                role: 'user',
                content: 'First',
            },
            {
                role: 'assistant',
                content: 'Second',
            },
            {
                role: 'user',
                content: 'Third',
            },
        ]);
    });
});
