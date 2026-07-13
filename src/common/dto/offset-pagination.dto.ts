import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OffsetPaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
});

export class OffsetPaginationDto extends createZodDto(OffsetPaginationSchema) {}
