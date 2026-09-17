import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const GenerationCancelledResponse = createResponseSchema(
    z.object({
        generationId: z.uuid(),
    }),
    'GenerationCancelledResponseDto'
);

export type GenerationCancelledResponse = z.infer<
    typeof GenerationCancelledResponse.schema
>;
