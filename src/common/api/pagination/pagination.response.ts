import { z } from 'zod';

import { ApiResponse } from '~/common/api/response/response.decorator';
import {
    createResponseSchema,
    type ResponseSchema,
} from '~/common/api/response/response.schema';

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
//TODO move cache to cache module
const paginatedResponseCache = new WeakMap<
    ResponseSchema,
    ResponseSchema<ReturnType<typeof createPaginatedSchema>>
>();

export function ApiPaginatedResponse<T extends z.ZodTypeAny>(
    item: ResponseSchema<T>
) {
    let response = paginatedResponseCache.get(item);

    if (!response) {
        const dtoName = item.dto.name.replace(/Dto$/, 'ListDto');
        response = createResponseSchema(
            createPaginatedSchema(item.schema),
            dtoName
        );
        paginatedResponseCache.set(item, response);
    }

    return ApiResponse(response);
}
