import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateOrganizationSchema = z.object({
    name: z.string().min(2).max(100).optional(),
});

export class UpdateOrganizationDto extends createZodDto(
    UpdateOrganizationSchema
) {}
