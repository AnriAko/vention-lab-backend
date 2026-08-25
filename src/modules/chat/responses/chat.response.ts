import { Field, ID, ObjectType } from '@nestjs/graphql';

import { ChatMemberResponse } from './chat-member.response';

@ObjectType('Chat')
export class ChatResponse {
    @Field(() => ID)
    id!: string;

    @Field(() => ID)
    organizationId!: string;

    @Field(() => [ChatMemberResponse])
    members!: ChatMemberResponse[];
}
