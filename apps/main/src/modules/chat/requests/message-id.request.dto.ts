import { ArgsType, Field, ID } from '@nestjs/graphql';
import { z } from 'zod';

export const MessageIdSchema = z.object({
    id: z.uuid(),
});

export type MessageId = z.infer<typeof MessageIdSchema>;

@ArgsType()
export class MessageIdArgs {
    @Field(() => ID)
    id!: string;
}
