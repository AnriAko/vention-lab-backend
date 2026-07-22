import { z } from 'zod';

import { createResponseSchema } from '~/common/api';
import { OrganizationRole } from '~/generated/prisma/enums';
import { OrganizationBase } from './organization.response';

const CurrentOrganizationMembership = OrganizationBase.extend({
    role: z.enum(OrganizationRole),
});

export const CurrentOrganizationsResponse = createResponseSchema(
    z
        .object({
            organizationRoles: z.array(
                z.object({
                    role: z.enum(OrganizationRole),
                    organization: OrganizationBase,
                })
            ),
        })
        .transform(({ organizationRoles }) => ({
            organizations: organizationRoles.map(({ role, organization }) => ({
                id: organization.id,
                name: organization.name,
                role,
            })),
        }))
        .pipe(
            z.object({
                organizations: z.array(CurrentOrganizationMembership),
            })
        ),
    'CurrentOrganizationsResponseDto'
);

export type CurrentOrganizationsResponse = z.infer<
    typeof CurrentOrganizationsResponse.schema
>;
