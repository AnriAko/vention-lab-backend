import { z } from 'zod';

import { MESSAGE_CONTENT_MAX_LENGTH } from '~/modules/chat/chat.constants';

export const WsSendMessageSchema = z.object({
    chatId: z.uuid(),
    content: z.string().trim().min(1).max(MESSAGE_CONTENT_MAX_LENGTH),
    clientMessageId: z.string().trim().min(1).max(128).optional(),
});

export type WsSendMessage = z.infer<typeof WsSendMessageSchema>;
