import { Field, ID, InputType } from '@nestjs/graphql';
import { z } from 'zod';

export const CreateChatSchema = z.object({
    userId: z.uuid(),
});

export type CreateChat = z.infer<typeof CreateChatSchema>;

@InputType()
export class CreateChatDto {
    @Field(() => ID)
    userId!: string;
}
