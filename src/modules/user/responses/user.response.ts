import { z } from 'zod';

import { createResponseSchema, DateTimeResponse } from '~/common/dto/response-schema';

export const UserResponse = createResponseSchema(
    z.object({
        id: z.uuid(),
        email: z.email(),
        name: z.string(),
        image: z.string(),
        isDeleted: z.boolean(),
        createdAt: DateTimeResponse,
        updatedAt: DateTimeResponse,
    }),
    'UserResponseDto'
);

export type UserResponse = z.infer<typeof UserResponse.schema>;

