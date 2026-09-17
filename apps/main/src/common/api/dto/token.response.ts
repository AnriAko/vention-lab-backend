import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const tokenSchema = z.object({
    accessToken: z.string(),
});

export const TokenResponse = createResponseSchema(
    tokenSchema,
    'TokenResponseDto'
);

export type TokenResponse = z.infer<typeof TokenResponse.schema>;
