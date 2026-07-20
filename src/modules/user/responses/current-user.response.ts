import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';
import { UserResponse } from './user.response';

export const CurrentUserResponse = createResponseSchema(
    UserResponse.schema,
    'CurrentUserResponseDto'
);

export type CurrentUserResponse = z.infer<typeof CurrentUserResponse.schema>;
