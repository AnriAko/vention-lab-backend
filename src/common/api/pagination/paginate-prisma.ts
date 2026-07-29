import type {
    PaginatedResult,
    PaginatePrismaOptions,
} from './pagination.types';

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
