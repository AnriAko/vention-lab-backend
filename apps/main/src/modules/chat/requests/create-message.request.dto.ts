import { Field, ID, InputType } from '@nestjs/graphql';
import { z } from 'zod';

import { MESSAGE_CONTENT_MAX_LENGTH } from '../chat.constants';

export const CreateMessageSchema = z.object({
    chatId: z.uuid(),
    content: z.string().trim().min(1).max(MESSAGE_CONTENT_MAX_LENGTH),
});

export type CreateMessage = z.infer<typeof CreateMessageSchema>;

@InputType()
export class CreateMessageDto {
    @Field(() => ID)
    chatId!: string;

    @Field()
    content!: string;
}
