import { ArgsType, Field, ID } from '@nestjs/graphql';
import { z } from 'zod';

export const ChatIdArgSchema = z.object({
    chatId: z.uuid(),
});

@ArgsType()
export class ChatIdArg {
    @Field(() => ID)
    chatId!: string;
}
