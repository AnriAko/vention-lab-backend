import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const OrganizationIdSchema = z.object({
    id: z.uuid(),
});

export class OrganizationIdDto extends createZodDto(OrganizationIdSchema) {}
