import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateOrganization = z.object({
    organizationName: z.string().min(2).max(100).optional().meta({
        examples: ['CatFans Renamed'],
    }),
});

export type UpdateOrganization = z.infer<typeof UpdateOrganization>;

export class UpdateOrganizationDto extends createZodDto(UpdateOrganization) {}
