import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';

export const EmptyResponse = createResponseSchema(z.null(), 'EmptyResponseDto');

export type EmptyResponse = z.infer<typeof EmptyResponse.schema>;
