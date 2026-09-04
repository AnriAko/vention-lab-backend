import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const MessageResponse = createResponseSchema(
    z.object({
        message: z.string(),
    }),
    'MessageResponseDto'
);

export type MessageResponse = z.infer<typeof MessageResponse.schema>;
