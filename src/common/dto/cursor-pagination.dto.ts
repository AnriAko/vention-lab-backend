import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CursorPaginationSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20),
});

export class CursorPaginationDto extends createZodDto(CursorPaginationSchema) {}
