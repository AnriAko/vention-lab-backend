import { z } from 'zod';

export const WsTypingSchema = z.object({
    chatId: z.uuid(),
});

export type WsTyping = z.infer<typeof WsTypingSchema>;
