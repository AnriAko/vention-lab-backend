import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SEED_PASSWORD } from '~/common/swagger/seed-examples';

export const CreateOrganizationWithAdmin = z.object({
    organizationName: z.string().min(2).max(100).meta({
        examples: ['FoxFans'],
    }),
    adminsEmail: z.email().meta({
        examples: ['admin.foxfans@example.com'],
    }),
    adminsName: z.string().min(1).meta({
        examples: ['FoxFans Admin'],
    }),
    adminsPassword: z.string().min(8).meta({
        examples: [SEED_PASSWORD],
    }),
});

export type CreateOrganizationWithAdmin = z.infer<
    typeof CreateOrganizationWithAdmin
>;

export class CreateOrganizationWithAdminDto extends createZodDto(
    CreateOrganizationWithAdmin
) {}
