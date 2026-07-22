import { z } from 'zod';

import { createResponseSchema } from '~/common/api';
import { OrganizationResponse } from './organization.response';
import { UserResponse } from '~/modules/user';

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
