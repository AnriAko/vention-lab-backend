import { ArgsType, Field, ID } from '@nestjs/graphql';
import { z } from 'zod';

export const ChatIdSchema = z.object({
    id: z.uuid(),
});

export type ChatId = z.infer<typeof ChatIdSchema>;

@ArgsType()
export class ChatIdArgs {
    @Field(() => ID)
    id!: string;
}
