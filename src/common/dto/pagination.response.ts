import { z } from 'zod';

export const OffsetPaginationMeta = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
});

export type OffsetPaginationMeta = z.infer<typeof OffsetPaginationMeta>;

export const CursorPaginationMeta = z.object({
    limit: z.number().int().min(1),
    nextCursor: z.string().nullable(),
    previousCursor: z.string().nullable().optional(),
});

export type CursorPaginationMeta = z.infer<typeof CursorPaginationMeta>;

export const createOffsetPaginated = <T extends z.ZodTypeAny>(item: T) =>
    z.object({
        items: z.array(item),
        pagination: OffsetPaginationMeta,
    });

export const createCursorPaginated = <T extends z.ZodTypeAny>(item: T) =>
    z.object({
        items: z.array(item),
        pagination: CursorPaginationMeta,
    });
