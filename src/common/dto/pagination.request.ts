import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OffsetPagination = z.object({
    page: z.coerce.number().int().min(1).default(1).meta({
        examples: [1],
    }),
    limit: z.coerce.number().int().min(1).max(200).default(20).meta({
        examples: [20],
    }),
});

export type OffsetPagination = z.infer<typeof OffsetPagination>;

export class OffsetPaginationQuery extends createZodDto(OffsetPagination) {}
