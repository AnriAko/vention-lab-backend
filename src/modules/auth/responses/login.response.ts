import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';

export const LoginResponse = createResponseSchema(
    z.object({
        id: z.uuid(),
        email: z.email(),
        accessToken: z.string(),
    }),
    'LoginResponseDto'
);

export type LoginResponse = z.infer<typeof LoginResponse.schema>;
