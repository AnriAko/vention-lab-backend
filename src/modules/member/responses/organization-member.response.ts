import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';
import { OrganizationRole } from '~/generated/prisma/enums';

const MemberOutput = z.object({
    id: z.uuid(),
    email: z.email(),
    name: z.string(),
    role: z.enum(OrganizationRole),
});

export const MemberResponse = createResponseSchema(
    z
        .object({
            id: z.uuid(),
            email: z.email(),
            name: z.string(),
            organizationRoles: z
                .array(z.object({ role: z.enum(OrganizationRole) }))
                .min(1),
        })
        .transform(({ organizationRoles, ...member }) => ({
            ...member,
            role: organizationRoles[0].role,
        }))
        .pipe(MemberOutput),
    'MemberResponseDto'
);

export type MemberResponse = z.infer<typeof MemberResponse.schema>;
