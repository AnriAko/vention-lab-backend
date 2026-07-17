import { z } from 'zod';

import { createOffsetPaginated } from '~/common/dto/pagination.response';
import { createResponseSchema } from '~/common/dto/response-schema';
import { OrganizationResponse } from './organization.response';

export const OrganizationListResponse = createResponseSchema(
    createOffsetPaginated(OrganizationResponse.schema),
    'OrganizationListResponseDto'
);

export type OrganizationListResponse = z.infer<typeof OrganizationListResponse.schema>;

