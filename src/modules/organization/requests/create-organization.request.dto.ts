import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_USERS } from '~/common/swagger/seed-examples';

export const CreateOrganization = z.object({
    organizationName: z.string().min(2).max(100).meta({
        examples: ['RabbitFans'],
    }),
    userId: z.uuid().meta({
        description: 'Existing user who becomes the org admin',
        examples: [SEED_USERS.demoMember.id],
    }),
});

export type CreateOrganization = z.infer<typeof CreateOrganization>;

export class CreateOrganizationDto extends createZodDto(CreateOrganization) {}
