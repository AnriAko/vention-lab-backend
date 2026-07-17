import { z } from 'zod';

import {
    createResponseSchema,
    DateTimeResponse,
} from '~/common/dto/response-schema';

export const OrganizationResponse = createResponseSchema(
    z.object({
        id: z.uuid(),
        name: z.string(),
        createdAt: DateTimeResponse,
        updatedAt: DateTimeResponse,
        isDeleted: z.boolean(),
    }),
    'OrganizationResponseDto'
);

export type OrganizationResponse = z.infer<typeof OrganizationResponse.schema>;
