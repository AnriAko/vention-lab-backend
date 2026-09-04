import { Field, ObjectType } from '@nestjs/graphql';

import { MessageResponse } from './message.response';
import { PaginationMetaResponse } from './pagination-meta.response';

@ObjectType('PaginatedMessages')
export class PaginatedMessagesResponse {
    @Field(() => [MessageResponse])
    data!: MessageResponse[];

    @Field(() => PaginationMetaResponse)
    pagination!: PaginationMetaResponse;
}
