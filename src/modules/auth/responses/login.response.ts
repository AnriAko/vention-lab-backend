import z from 'zod';
import { createResponseSchema } from '~/common/dto/response-schema';
import { tokenSchema } from '~/common/dto/token.response';

export const LoginResponse = createResponseSchema(
    tokenSchema,
    'LoginResponseDto'
);

export type LoginResponse = z.infer<typeof LoginResponse.schema>;
