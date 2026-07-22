import z from 'zod';
import { createResponseSchema, tokenSchema } from '~/common/api';

export const LoginResponse = createResponseSchema(
    tokenSchema,
    'LoginResponseDto'
);

export type LoginResponse = z.infer<typeof LoginResponse.schema>;
