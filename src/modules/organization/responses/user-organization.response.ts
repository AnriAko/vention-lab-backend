import { z } from 'zod';

import {
    createResponseSchema,
    DateTimeResponse,
} from '~/common/dto/response-schema';
import { OrganizationRole } from '~/generated/prisma/enums';

export const UserOrganizationResponse = createResponseSchema(
    z.object({
        id: z.uuid(),
        name: z.string(),
        createdAt: DateTimeResponse,
        updatedAt: DateTimeResponse,
        isDeleted: z.boolean(),
        role: z.enum(OrganizationRole),
    }),
    'UserOrganizationResponseDto'
);

export type UserOrganizationResponse = z.infer<
    typeof UserOrganizationResponse.schema
>;
