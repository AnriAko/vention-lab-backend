import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .meta({
            examples: [1],
        }),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(200)
        .default(20)
        .meta({
            examples: [20],
        }),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export class PaginationQuery extends createZodDto(PaginationSchema) {}
