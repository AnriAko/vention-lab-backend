import { PaginationSchema } from '~/common/api/pagination/pagination.schema';
import type { Pagination } from '~/common/api/pagination/pagination.schema';

import { parseInput } from './parse-input';

export function parsePagination(input: {
    page?: number;
    limit?: number;
}): Pagination {
    return parseInput(PaginationSchema, {
        page: input.page ?? 1,
        limit: input.limit ?? 20,
    });
}
