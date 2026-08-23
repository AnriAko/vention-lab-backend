import type { z } from 'zod';

import { createPaginatedSchema } from '~/common/api/pagination/paginated.schema';
import {
    createResponseSchema,
    type ResponseSchema,
} from '~/common/api/response/response.schema';

const paginatedResponseCache = new WeakMap<
    ResponseSchema,
    ResponseSchema<ReturnType<typeof createPaginatedSchema>>
>();

export function getOrCreatePaginatedResponseSchema<T extends z.ZodTypeAny>(
    item: ResponseSchema<T>
): ResponseSchema<ReturnType<typeof createPaginatedSchema>> {
    const cached = paginatedResponseCache.get(item);

    if (cached) {
        return cached;
    }

    const dtoName = item.dto.name.replace(/Dto$/, 'ListDto');
    const response = createResponseSchema(
        createPaginatedSchema(item.schema),
        dtoName
    );

    paginatedResponseCache.set(item, response);
    return response;
}
