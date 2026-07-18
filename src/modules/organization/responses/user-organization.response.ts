import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';
import { OrganizationRole } from '~/generated/prisma/enums';
import { OrganizationResponse } from './organization.response';

const UserOrganizationOutput = z.object({
    id: z.uuid(),
    name: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    isDeleted: z.boolean(),
    role: z.enum(OrganizationRole),
});

export const UserOrganizationResponse = createResponseSchema(
    z
        .object({
            role: z.enum(OrganizationRole),
            organization: OrganizationResponse.schema,
        })
        .transform(({ organization, role }) => ({
            ...organization,
            role,
        }))
        .pipe(UserOrganizationOutput),
    'UserOrganizationResponseDto'
);

export type UserOrganizationResponse = z.infer<
    typeof UserOrganizationResponse.schema
>;
