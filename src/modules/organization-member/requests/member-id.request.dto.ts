import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_USERS } from '~/common/swagger/seed-examples';

export const OrganizationMemberParams = z.object({
    userId: z.uuid().meta({
        examples: [SEED_USERS.demoMember.id],
    }),
});

export type OrganizationMemberParams = z.infer<typeof OrganizationMemberParams>;

export class OrganizationMemberParamsDto extends createZodDto(
    OrganizationMemberParams
) {}
