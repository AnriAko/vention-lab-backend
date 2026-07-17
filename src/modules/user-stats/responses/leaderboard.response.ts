import { z } from 'zod';

import { createOffsetPaginated } from '~/common/dto/pagination.response';
import { createResponseSchema } from '~/common/dto/response-schema';

const LeaderboardEntry = z.object({
    id: z.uuid(),
    name: z.string(),
    messageCount: z.number().int(),
    percentOfAllMessages: z.number(),
    rank: z.number().int(),
});

export const LeaderboardResponse = createResponseSchema(
    createOffsetPaginated(LeaderboardEntry),
    'LeaderboardResponseDto'
);

export type LeaderboardResponse = z.infer<typeof LeaderboardResponse.schema>;

