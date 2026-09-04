import { z } from 'zod';

import { createResponseSchema } from '~/common/api/response/response.schema';

const HealthIndicator = z.object({
    status: z.string(),
    enabled: z.boolean().optional(),
    message: z.string().optional(),
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
