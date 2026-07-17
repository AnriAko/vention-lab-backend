import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';
import { OrganizationRole } from '~/generated/prisma/enums';

export const OrganizationMemberResponse = createResponseSchema(
    z.object({
        id: z.uuid(),
        email: z.email(),
        name: z.string(),
        role: z.enum(OrganizationRole),
    }),
    'OrganizationMemberResponseDto'
);

export type OrganizationMemberResponse = z.infer<
    typeof OrganizationMemberResponse.schema
>;
