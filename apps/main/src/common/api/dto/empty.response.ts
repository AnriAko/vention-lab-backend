import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

export const EmptyResponse = createResponseSchema(z.null(), 'EmptyResponseDto');

export type EmptyResponse = z.infer<typeof EmptyResponse.schema>;
