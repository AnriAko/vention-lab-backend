import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
    SEED_ORGANIZATIONS,
    SEED_PASSWORD,
    SEED_USERS,
} from '~/common/swagger/seed-examples';

export const UpdateUser = z
    .object({
        email: z.email().meta({
            examples: [SEED_USERS.demoMember.email],
        }),
        name: z
            .string()
            .min(1)
            .meta({
                examples: ['Updated Demo Member'],
            }),
        password: z
            .string()
            .min(8)
            .meta({
                examples: [SEED_PASSWORD],
            }),
        organizationId: z.uuid().meta({
            examples: [SEED_ORGANIZATIONS.catFans.id],
        }),
    })
    .partial();

export type UpdateUser = z.infer<typeof UpdateUser>;

export class UpdateUserDto extends createZodDto(UpdateUser) {}
