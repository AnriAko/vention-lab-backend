import { ArgsType, Field, ID } from '@nestjs/graphql';
import { z } from 'zod';

import { PaginationSchema } from '~/common/api/pagination/pagination.schema';
import { PaginationArgs } from './pagination.args';

export const ChatMessagesSchema = PaginationSchema.extend({
    chatId: z.uuid(),
});

export type ChatMessages = z.infer<typeof ChatMessagesSchema>;

@ArgsType()
export class ChatMessagesArgs extends PaginationArgs {
    @Field(() => ID)
    chatId!: string;
}
