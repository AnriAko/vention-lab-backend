import { z } from 'zod';

import { createResponseSchema } from '~/common/dto/response-schema';

const HealthIndicator = z.object({
    status: z.string(),
});

export const HealthCheckResponse = createResponseSchema(
    z.object({
        status: z.string(),
        info: z.record(z.string(), HealthIndicator).optional(),
        error: z.record(z.string(), HealthIndicator).optional(),
        details: z.record(z.string(), HealthIndicator).optional(),
    }),
    'HealthCheckResponseDto'
);

export type HealthCheckResponse = z.infer<typeof HealthCheckResponse.schema>;
