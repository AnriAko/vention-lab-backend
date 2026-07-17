import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_ORGANIZATIONS } from '~/common/swagger/seed-examples';

export const OrganizationIdParam = z.object({
    organizationId: z.uuid().meta({
        examples: [SEED_ORGANIZATIONS.catFans.id],
    }),
});

export type OrganizationIdParam = z.infer<typeof OrganizationIdParam>;

export class OrganizationIdParamDto extends createZodDto(OrganizationIdParam) {}
