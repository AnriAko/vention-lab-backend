import { z } from 'zod';

import { createResponseSchema } from '~/common/api';
import { OrganizationResponse } from '~/modules/organization';
import { UserResponse } from '~/modules/user';

export const SubstringSearchResponse = createResponseSchema(
    z.object({
        users: z.array(UserResponse.schema),
        organizations: z.array(OrganizationResponse.schema),
    }),
    'SubstringSearchResponseDto'
);

export type SubstringSearchResponse = z.infer<
    typeof SubstringSearchResponse.schema
>;
