import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const UserSearchHit = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
});

export const UserSearchResponse = createResponseSchema(
    z.object({
        users: z.array(UserSearchHit),
    }),
    'UserSearchResponseDto'
);

export type UserSearchResponse = z.infer<typeof UserSearchResponse.schema>;
export type UserSearchHit = z.infer<typeof UserSearchHit>;
