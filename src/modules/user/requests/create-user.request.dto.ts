import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_ORGANIZATIONS, SEED_PASSWORD } from '~/common/api/swagger/seed-examples';

export const CreateUser = z.object({
    email: z.email().meta({
        examples: ['new.member@example.com'],
    }),
    name: z
        .string()
        .min(1)
        .meta({
            examples: ['New CatFans Member'],
        }),
    organizationId: z.uuid().meta({
        description:
            'Must match active organization (and usually x-organization-id)',
        examples: [SEED_ORGANIZATIONS.catFans.id],
    }),
    password: z
        .string()
        .min(8)
        .meta({
            examples: [SEED_PASSWORD],
        }),
});

export type CreateUser = z.infer<typeof CreateUser>;

export class CreateUserDto extends createZodDto(CreateUser) {}
