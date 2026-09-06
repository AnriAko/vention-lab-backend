import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const GenerationErrorResponse = createResponseSchema(
    z.object({
        generationId: z.uuid(),
        error: z.string(),
    }),
    'GenerationErrorResponseDto'
);

export type GenerationErrorResponse = z.infer<
    typeof GenerationErrorResponse.schema
>;
