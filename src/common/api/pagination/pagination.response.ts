import { z } from 'zod';

import { ApiResponse } from '~/common/api/response/response.decorator';
import type { ResponseSchema } from '~/common/api/response/response.schema';
import { getOrCreatePaginatedResponseSchema } from '~/infrastructure/cache/paginated-response.cache';

export {
    PaginationMetaSchema,
    createPaginatedSchema,
} from '~/common/api/pagination/paginated.schema';

export function ApiPaginatedResponse<T extends z.ZodTypeAny>(
    item: ResponseSchema<T>
) {
    return ApiResponse(getOrCreatePaginatedResponseSchema(item));
}
