import { z } from 'zod';

export const WsDeleteMessageSchema = z.object({
    messageId: z.uuid(),
});

export type WsDeleteMessage = z.infer<typeof WsDeleteMessageSchema>;
