import { AppException } from '~/common/errors/app-exception';
import { CommonErrors } from '~/common/errors/common-errors';
import type { z } from 'zod';

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);

    if (!result.success) {
        throw new AppException(CommonErrors.VALIDATION_ERROR, {
            details: result.error.issues,
        });
    }

    return result.data;
}
