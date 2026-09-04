import { z } from 'zod';

export const WsJoinChatSchema = z.object({
    chatId: z.uuid(),
});

export type WsJoinChat = z.infer<typeof WsJoinChatSchema>;
