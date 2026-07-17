import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';
import { OrganizationResponse } from './organization.response';
import { UserResponse } from '~/modules/user/responses/user.response';

export const OrganizationWithAdminResponse = createResponseSchema(
    z.object({
        organization: OrganizationResponse.schema,
        user: UserResponse.schema,
    }),
    'OrganizationWithAdminResponseDto'
);

export type OrganizationWithAdminResponse = z.infer<
    typeof OrganizationWithAdminResponse.schema
>;

