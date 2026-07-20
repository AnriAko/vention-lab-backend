import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';
import { OrganizationResponse } from '~/modules/organization/responses/organization.response';
import { UserResponse } from '~/modules/user/responses/user.response';

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
