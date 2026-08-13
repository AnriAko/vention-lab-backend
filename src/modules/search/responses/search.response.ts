import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

const SearchUserHit = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    rank: z.number().optional(),
});

const SearchOrganizationHit = z.object({
    id: z.uuid(),
    name: z.string(),
    rank: z.number().optional(),
});

export const SearchResponse = createResponseSchema(
    z.object({
        users: z.array(SearchUserHit),
        organizations: z.array(SearchOrganizationHit),
    }),
    'SearchResponseDto'
);

export type SearchResponse = z.infer<typeof SearchResponse.schema>;
