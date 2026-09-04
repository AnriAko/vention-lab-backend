import { Field, ObjectType } from '@nestjs/graphql';

import { ChatResponse } from './chat.response';
import { PaginationMetaResponse } from './pagination-meta.response';

@ObjectType('PaginatedChats')
export class PaginatedChatsResponse {
    @Field(() => [ChatResponse])
    data!: ChatResponse[];

    @Field(() => PaginationMetaResponse)
    pagination!: PaginationMetaResponse;
}
