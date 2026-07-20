import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { OrganizationRole } from '~/generated/prisma/client';

export const UpdateMemberRole = z.object({
    role: z.enum(OrganizationRole).meta({
        examples: [OrganizationRole.ADMIN, OrganizationRole.USER],
    }),
});

export type UpdateMemberRole = z.infer<typeof UpdateMemberRole>;

export class UpdateMemberRoleDto extends createZodDto(UpdateMemberRole) {}
