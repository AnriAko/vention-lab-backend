import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const LeaderboardEntryResponse = createResponseSchema(
    z.object({
        id: z.uuid(),
        name: z.string(),
        messageCount: z.number().int(),
        percentOfAllMessages: z.number(),
        rank: z.number().int(),
    }),
    'LeaderboardEntryResponseDto'
);

export type LeaderboardEntryResponse = z.infer<
    typeof LeaderboardEntryResponse.schema
>;
