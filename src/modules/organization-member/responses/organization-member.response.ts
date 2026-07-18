import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';
import { OrganizationRole } from '~/generated/prisma/enums';

const OrganizationMemberOutput = z.object({
    id: z.uuid(),
    email: z.email(),
    name: z.string(),
    role: z.enum(OrganizationRole),
});

export const OrganizationMemberResponse = createResponseSchema(
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
        .pipe(OrganizationMemberOutput),
    'OrganizationMemberResponseDto'
);

export type OrganizationMemberResponse = z.infer<
    typeof OrganizationMemberResponse.schema
>;
