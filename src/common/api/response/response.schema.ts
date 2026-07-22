import { createZodDto, type ZodDto } from 'nestjs-zod';
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