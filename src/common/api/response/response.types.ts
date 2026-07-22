import type { z } from 'zod';

import type { ResponseSchema } from './response.schema';

export type InferResponse<T extends ResponseSchema> = z.infer<T['schema']>;

export type ApiSuccessEnvelope<T = unknown> = {
    success: true;
    message?: string;
    requestId?: string;
    timestamp: string;
    data: T;
};