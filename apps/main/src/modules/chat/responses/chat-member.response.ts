import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('ChatMember')
export class ChatMemberResponse {
    @Field(() => ID)
    id!: string;

    @Field()
    email!: string;

    @Field()
    name!: string;

    @Field()
    image!: string;
}
