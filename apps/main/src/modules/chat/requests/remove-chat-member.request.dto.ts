import { Field, ID, InputType } from '@nestjs/graphql';
import { z } from 'zod';

export const RemoveChatMemberSchema = z.object({
    chatId: z.uuid(),
    userId: z.uuid(),
});

export type RemoveChatMember = z.infer<typeof RemoveChatMemberSchema>;

@InputType()
export class RemoveChatMemberDto {
    @Field(() => ID)
    chatId!: string;

    @Field(() => ID)
    userId!: string;
}
