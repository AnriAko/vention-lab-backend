import { z } from 'zod';

export const PaginationMetaSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
});

export type PaginationMetaSchema = z.infer<typeof PaginationMetaSchema>;

export function createPaginatedSchema<T extends z.ZodTypeAny>(item: T) {
    return z.object({
        data: z.array(item),
        pagination: PaginationMetaSchema,
    });
}
