import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_ORGANIZATIONS } from '~/common/api';

export const OrganizationId = z.object({
    id: z.uuid().meta({
        examples: [SEED_ORGANIZATIONS.catFans.id],
    }),
});

export type OrganizationId = z.infer<typeof OrganizationId>;

export class OrganizationIdDto extends createZodDto(OrganizationId) {}
