import { z } from 'zod';

export const ApiErrorResponse = z.object({
    success: z.literal(false),
    message: z.string(),
    errorCode: z.string(),
    requestId: z.string().optional(),
    timestamp: z.string(),
    details: z.unknown().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponse>;
