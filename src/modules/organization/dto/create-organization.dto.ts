import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateOrganizationSchema = z.object({
    name: z.string().min(2).max(100),
});

export class CreateOrganizationDto extends createZodDto(
    CreateOrganizationSchema
) {}
