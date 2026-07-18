import { applyDecorators } from '@nestjs/common';
import { createZodDto, ZodResponse, type ZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DateTimeResponse = z
    .union([z.date(), z.iso.datetime()])
    .transform((value) => (value instanceof Date ? value.toISOString() : value))
    .pipe(z.iso.datetime());

export type ResponseSchema<T extends z.ZodTypeAny = z.ZodTypeAny> = {
    readonly schema: T;
    readonly dto: ZodDto<T>;
};

export function createResponseSchema<T extends z.ZodTypeAny>(
    schema: T,
    name: string
): ResponseSchema<T> {
    const dto = createZodDto(schema);
    Object.defineProperty(dto, 'name', { value: name });

    return {
        schema,
        dto,
    };
}

export function createArrayResponse<T extends z.ZodTypeAny>(
    response: ResponseSchema<T>,
    name: string
): ResponseSchema<z.ZodArray<T>> {
    return createResponseSchema(z.array(response.schema), name);
}

export function ApiResponse<T extends z.ZodTypeAny>(
    response: ResponseSchema<T>
) {
    return applyDecorators(ZodResponse({ type: response.dto as never }));
}

export type InferResponse<T extends ResponseSchema> = z.infer<T['schema']>;

export type ApiSuccessEnvelope<T = unknown> = {
    success: true;
    message?: string;
    requestId?: string;
    timestamp: string;
    data: T;
};
