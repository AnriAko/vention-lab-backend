import { applyDecorators } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import type { z } from 'zod';

import type { ResponseSchema } from './response.schema';

export function ApiResponse<T extends z.ZodTypeAny>(
    response: ResponseSchema<T>
) {
    return applyDecorators(ZodResponse({ type: response.dto as never }));
}
