import type { Pagination } from './pagination.schema';

export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
};

export type PaginatedResult<T> = {
    data: T[];
    pagination: PaginationMeta;
};

export type PrismaPageableModel<T> = {
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
