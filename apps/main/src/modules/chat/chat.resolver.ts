import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Roles } from '~/common/security/decorators/roles.decorator';
import { AppRole } from '~/common/security/permissions/app-role.enum';

import { ChatService } from './chat.service';
import { AddChatMemberDto } from './requests/add-chat-member.request.dto';
import { ChatMessagesArgs } from './requests/chat-messages.request.dto';
import { CreateChatDto } from './requests/create-chat.request.dto';
import { CreateMessageDto } from './requests/create-message.request.dto';
import { PaginationArgs } from './requests/pagination.args';
import { RemoveChatMemberDto } from './requests/remove-chat-member.request.dto';
import { ChatMemberResponse } from './responses/chat-member.response';
import { ChatResponse } from './responses/chat.response';
import { MessageResponse } from './responses/message.response';
import { PaginatedChatsResponse } from './responses/paginated-chats.response';
import { PaginatedMessagesResponse } from './responses/paginated-messages.response';

@Resolver()
@Roles(AppRole.USER)
export class ChatResolver {
    constructor(private readonly chatService: ChatService) {}

    @Query(() => ChatResponse, { name: 'chat' })
    chat(@Args('id', { type: () => ID }) id: string) {
        return this.chatService.findById(id);
    }

    @Query(() => PaginatedChatsResponse, { name: 'chats' })
    chats(@Args() pagination: PaginationArgs) {
        return this.chatService.findAll(pagination);
    }

    @Query(() => [ChatMemberResponse], { name: 'chatMembers' })
    chatMembers(@Args('chatId', { type: () => ID }) chatId: string) {
        return this.chatService.findMembers(chatId);
    }

    @Query(() => PaginatedMessagesResponse, { name: 'messages' })
    messages(@Args() args: ChatMessagesArgs) {
        return this.chatService.findMessages(args);
    }

    @Mutation(() => ChatResponse, { name: 'createChat' })
    createChat(@Args('input') input: CreateChatDto) {
        return this.chatService.createChat(input);
    }

    @Mutation(() => Boolean, { name: 'deleteChat' })
    deleteChat(@Args('id', { type: () => ID }) id: string) {
        return this.chatService.deleteChat(id);
    }

    @Mutation(() => ChatMemberResponse, { name: 'addChatMember' })
    addChatMember(@Args('input') input: AddChatMemberDto) {
        return this.chatService.addChatMember(input);
    }

    @Mutation(() => Boolean, { name: 'removeChatMember' })
    removeChatMember(@Args('input') input: RemoveChatMemberDto) {
        return this.chatService.removeChatMember(input);
    }

    @Mutation(() => MessageResponse, { name: 'createMessage' })
    createMessage(@Args('input') input: CreateMessageDto) {
        return this.chatService.createMessage(input);
    }

    @Mutation(() => Boolean, { name: 'deleteMessage' })
    deleteMessage(@Args('id', { type: () => ID }) id: string) {
        return this.chatService.deleteMessage(id);
    }
}
