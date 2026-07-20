import { z } from 'zod';

import { createOffsetPaginated } from '~/common/dto/pagination.response';
import { createResponseSchema } from '~/common/dto/response-schema';
import { UserOrganizationResponse } from './user-organization.response';

export const UserOrganizationListResponse = createResponseSchema(
    createOffsetPaginated(UserOrganizationResponse.schema),
    'UserOrganizationListResponseDto'
);

export type UserOrganizationListResponse = z.infer<
    typeof UserOrganizationListResponse.schema
>;
