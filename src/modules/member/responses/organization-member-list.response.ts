import { z } from 'zod';

import { createOffsetPaginated } from '~/common/dto/pagination.response';
import { createResponseSchema } from '~/common/dto/response-schema';
import { MemberResponse } from './organization-member.response';

export const MemberListResponse = createResponseSchema(
    createOffsetPaginated(MemberResponse.schema),
    'MemberListResponseDto'
);

export type MemberListResponse = z.infer<typeof MemberListResponse.schema>;
