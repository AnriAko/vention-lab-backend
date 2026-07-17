import { z } from 'zod';

import { createOffsetPaginated } from '~/common/dto/pagination.response';
import { createResponseSchema } from '~/common/dto/response-schema';
import { OrganizationMemberResponse } from './organization-member.response';

export const OrganizationMemberListResponse = createResponseSchema(
    createOffsetPaginated(OrganizationMemberResponse.schema),
    'OrganizationMemberListResponseDto'
);

export type OrganizationMemberListResponse = z.infer<
    typeof OrganizationMemberListResponse.schema
>;
