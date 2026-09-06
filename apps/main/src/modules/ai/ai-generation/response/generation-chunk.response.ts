import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const GenerationChunkResponse = createResponseSchema(
    z.object({
        generationId: z.uuid(),
        chunk: z.string(),
    }),
    'GenerationChunkResponseDto'
);

export type GenerationChunkResponse = z.infer<
    typeof GenerationChunkResponse.schema
>;
