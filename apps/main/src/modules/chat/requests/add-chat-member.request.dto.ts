import { Field, ID, InputType } from '@nestjs/graphql';
import { z } from 'zod';

export const AddChatMemberSchema = z.object({
    chatId: z.uuid(),
    userId: z.uuid(),
});

export type AddChatMember = z.infer<typeof AddChatMemberSchema>;

@InputType()
export class AddChatMemberDto {
    @Field(() => ID)
    chatId!: string;

    @Field(() => ID)
    userId!: string;
}
