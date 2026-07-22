import type { Pagination } from './pagination.schema';
import type { PaginatedResult } from './pagination.types';

type PrismaPageableModel<T> = {
    findMany(args: any): Promise<T[]>;
    count(args: any): Promise<number>;
};

export type PaginatePrismaOptions<T> = {
    pagination: Pagination;
    model: PrismaPageableModel<T>;
    where?: unknown;
    select?: unknown;
    include?: unknown;
    orderBy?: unknown;
};

export async function paginatePrisma<T>({
    pagination,
    model,
    where,
    select,
    include,
    orderBy,
}: PaginatePrismaOptions<T>): Promise<PaginatedResult<T>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        model.findMany({
            where,
            select,
            include,
            orderBy,
            skip,
            take: limit,
        }),
        model.count({ where }),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
        },
    };
}
