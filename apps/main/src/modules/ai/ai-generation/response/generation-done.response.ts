import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const GenerationDoneResponse = createResponseSchema(
    z.object({
        generationId: z.uuid(),
    }),
    'GenerationDoneResponseDto'
);

export type GenerationDoneResponse = z.infer<
    typeof GenerationDoneResponse.schema
>;
