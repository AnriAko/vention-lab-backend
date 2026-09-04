import { z } from 'zod';

import {
    createResponseSchema,
    DateTimeResponse,
} from '~/common/api/response/response.schema';

export const OrganizationBase = z.object({
    id: z.uuid(),
    name: z.string(),
});

export const OrganizationResponse = createResponseSchema(
    OrganizationBase.extend({
        createdAt: DateTimeResponse,
        updatedAt: DateTimeResponse,
        isDeleted: z.boolean(),
    }),
    'OrganizationResponseDto'
);

export type OrganizationResponse = z.infer<typeof OrganizationResponse.schema>;
