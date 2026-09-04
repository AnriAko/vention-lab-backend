import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

import { ChatMemberResponse } from './chat-member.response';

@ObjectType('Message')
export class MessageResponse {
    @Field(() => ID)
    id!: string;

    @Field(() => ID)
    chatId!: string;

    @Field(() => ID)
    senderId!: string;

    @Field()
    content!: string;

    @Field(() => GraphQLISODateTime)
    createdAt!: Date;

    @Field(() => ChatMemberResponse)
    sender!: ChatMemberResponse;
}
