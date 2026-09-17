import type z from 'zod';
import { createResponseSchema } from '~/common/api/response/response.schema';
import { tokenSchema } from '~/common/api/dto/token.response';

export const LoginResponse = createResponseSchema(
    tokenSchema,
    'LoginResponseDto'
);

export type LoginResponse = z.infer<typeof LoginResponse.schema>;
