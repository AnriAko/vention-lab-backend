import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_ORGANIZATIONS, SEED_USERS } from '~/common/swagger/seed-examples';

export const OrganizationMemberParams = z.object({
    organizationId: z.uuid().meta({
        examples: [SEED_ORGANIZATIONS.catFans.id],
    }),
    userId: z.uuid().meta({
        examples: [SEED_USERS.demoMember.id],
    }),
});

export type OrganizationMemberParams = z.infer<typeof OrganizationMemberParams>;

export class OrganizationMemberParamsDto extends createZodDto(
    OrganizationMemberParams
) {}
