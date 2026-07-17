import { z } from 'zod';

import { createOffsetPaginated } from '~/common/dto/pagination.response';
import { createResponseSchema } from '~/common/dto/response-schema';
import { UserResponse } from './user.response';

export const UserListResponse = createResponseSchema(
    createOffsetPaginated(UserResponse.schema),
    'UserListResponseDto'
);

export type UserListResponse = z.infer<typeof UserListResponse.schema>;
