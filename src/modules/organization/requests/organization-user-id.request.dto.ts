import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_USERS } from '~/common/api/swagger/seed-examples';

export const OrganizationUserId = z.object({
    userId: z.uuid().meta({
        examples: [SEED_USERS.demoMember.id],
    }),
});

export type OrganizationUserId = z.infer<typeof OrganizationUserId>;

export class OrganizationUserIdDto extends createZodDto(OrganizationUserId) {}
