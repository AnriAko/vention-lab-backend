import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';

export const TokenResponse = createResponseSchema(
    z.object({
        accessToken: z.string(),
    }),
    'TokenResponseDto'
);

export type TokenResponse = z.infer<typeof TokenResponse.schema>;
