import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import { AUTH_GUEST } from '~/common/security/auth.types';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { AuthErrors } from '~/modules/auth/auth.errors';
import { LoggerService } from '~/infrastructure/logging/logger.service';

import { CHAT_MAX_MEMBERS } from './chat.constants';
import { ChatErrors } from './chat.errors';
import { ChatRepository } from './chat.repository';
import {
    AddChatMemberDto,
    AddChatMemberSchema,
} from './requests/add-chat-member.request.dto';
import { ChatIdArgSchema } from './requests/chat-id-arg.request.dto';
import { ChatIdSchema } from './requests/chat-id.request.dto';
import {
    ChatMessagesArgs,
    ChatMessagesSchema,
} from './requests/chat-messages.request.dto';
import {
    CreateChatDto,
    CreateChatSchema,
} from './requests/create-chat.request.dto';
import {
    CreateMessageDto,
    CreateMessageSchema,
} from './requests/create-message.request.dto';
import { MessageIdSchema } from './requests/message-id.request.dto';
import { PaginationArgs } from './requests/pagination.args';
import {
    RemoveChatMemberDto,
    RemoveChatMemberSchema,
} from './requests/remove-chat-member.request.dto';
import { ChatMemberResponse } from './responses/chat-member.response';
import { ChatResponse } from './responses/chat.response';
import { MessageResponse } from './responses/message.response';
import { PaginatedChatsResponse } from './responses/paginated-chats.response';
import { PaginatedMessagesResponse } from './responses/paginated-messages.response';
import { parseInput } from './utils/parse-input';
import { parsePagination } from './utils/parse-pagination';
import { toChatMemberResponse } from './utils/to-chat-member-response';
import { toChatResponse } from './utils/to-chat-response';
import { toMessageResponse } from './utils/to-message-response';

@Injectable()
export class ChatService {
    constructor(
        private readonly chatRepository: ChatRepository,
        private readonly logger: LoggerService
    ) {}

    async findById(id: string): Promise<ChatResponse> {
        const chatId = parseInput(ChatIdSchema, { id }).id;
        const chat = await this.requireChatMembership(chatId);

        return toChatResponse(chat);
    }

    async findAll(
        paginationInput: PaginationArgs
    ): Promise<PaginatedChatsResponse> {
        const pagination = parsePagination(paginationInput);
        const userId = this.getCurrentUserId();
        const result = await this.chatRepository.findAllForUser(
            userId,
            pagination
        );

        return {
            data: result.data.map(toChatResponse),
            pagination: result.pagination,
        };
    }

    async findMembers(chatId: string): Promise<ChatMemberResponse[]> {
        const parsedChatId = parseInput(ChatIdArgSchema, { chatId }).chatId;
        await this.requireChatMembership(parsedChatId);

        const members = await this.chatRepository.findMembers(parsedChatId);

        return members.map((membership) =>
            toChatMemberResponse(membership.user)
        );
    }

    async findMessages(
        args: ChatMessagesArgs
    ): Promise<PaginatedMessagesResponse> {
        const parsed = parseInput(ChatMessagesSchema, args);
        await this.requireChatMembership(parsed.chatId);

        const result = await this.chatRepository.findMessages(parsed.chatId, {
            page: parsed.page,
            limit: parsed.limit,
        });

        return {
            data: result.data.map(toMessageResponse),
            pagination: result.pagination,
        };
    }

    async createChat(input: CreateChatDto): Promise<ChatResponse> {
        const { userId: otherUserId } = parseInput(CreateChatSchema, input);
        const currentUserId = this.getCurrentUserId();

        if (otherUserId === currentUserId) {
            throw new AppException(ChatErrors.CANNOT_CHAT_WITH_SELF);
        }

        const otherMember =
            await this.chatRepository.findOrganizationMember(otherUserId);

        if (!otherMember) {
            throw new AppException(ChatErrors.USER_NOT_IN_ORGANIZATION);
        }

        const existing = await this.chatRepository.findDirectChat(
            currentUserId,
            otherUserId
        );

        if (existing) {
            throw new AppException(ChatErrors.ALREADY_EXISTS);
        }

        const chat = await this.chatRepository.create(
            currentUserId,
            otherUserId
        );

        this.logger.log(`[ChatService] created id=${chat.id}`);

        return toChatResponse(chat);
    }

    async deleteChat(id: string): Promise<boolean> {
        const chatId = parseInput(ChatIdSchema, { id }).id;
        await this.requireChatMembership(chatId);

        await this.chatRepository.delete(chatId);

        this.logger.log(`[ChatService] hard deleted id=${chatId}`);

        return true;
    }

    async addChatMember(input: AddChatMemberDto): Promise<ChatMemberResponse> {
        const { chatId, userId } = parseInput(AddChatMemberSchema, input);
        await this.requireChatMembership(chatId);

        const targetMember =
            await this.chatRepository.findOrganizationMember(userId);

        if (!targetMember) {
            throw new AppException(ChatErrors.USER_NOT_IN_ORGANIZATION);
        }

        const alreadyMember = await this.chatRepository.isMember(
            chatId,
            userId
        );

        if (alreadyMember) {
            throw new AppException(ChatErrors.ALREADY_MEMBER);
        }

        const memberCount = await this.chatRepository.countMembers(chatId);

        if (memberCount >= CHAT_MAX_MEMBERS) {
            throw new AppException(ChatErrors.MEMBER_LIMIT_REACHED);
        }

        const membership = await this.chatRepository.addMember(chatId, userId);

        this.logger.log(
            `[ChatService] added member userId=${userId} chatId=${chatId}`
        );

        return toChatMemberResponse(membership.user);
    }

    async removeChatMember(input: RemoveChatMemberDto): Promise<boolean> {
        const { chatId, userId } = parseInput(RemoveChatMemberSchema, input);
        await this.requireChatMembership(chatId);

        const isMember = await this.chatRepository.isMember(chatId, userId);

        if (!isMember) {
            throw new AppException(ChatErrors.MEMBER_NOT_FOUND);
        }

        await this.chatRepository.removeMember(chatId, userId);

        this.logger.log(
            `[ChatService] removed member userId=${userId} chatId=${chatId}`
        );

        return true;
    }

    async createMessage(input: CreateMessageDto): Promise<MessageResponse> {
        const { chatId, content } = parseInput(CreateMessageSchema, input);
        const senderId = this.getCurrentUserId();

        await this.requireChatMembership(chatId);

        const message = await this.chatRepository.createMessage(
            chatId,
            senderId,
            content
        );

        this.logger.log(
            `[ChatService] created message id=${message.id} chatId=${chatId}`
        );

        return toMessageResponse(message);
    }

    async deleteMessage(id: string): Promise<boolean> {
        const messageId = parseInput(MessageIdSchema, { id }).id;
        const currentUserId = this.getCurrentUserId();
        const message = await this.chatRepository.findMessageById(messageId);

        if (!message) {
            throw new AppException(ChatErrors.MESSAGE_NOT_FOUND);
        }

        await this.requireChatMembership(message.chatId);

        if (message.senderId !== currentUserId) {
            throw new AppException(ChatErrors.MESSAGE_DELETE_FORBIDDEN);
        }

        await this.chatRepository.deleteMessage(messageId);

        this.logger.log(`[ChatService] hard deleted message id=${messageId}`);

        return true;
    }

    private getCurrentUserId(): string {
        const userId = requestContext.getStore()?.userId;

        if (!userId || userId === AUTH_GUEST) {
            throw new AppException(AuthErrors.MISSING_AUTHENTICATED_USER);
        }

        return userId;
    }

    private async requireChatMembership(chatId: string) {
        const chat = await this.chatRepository.findByIdForUser(
            chatId,
            this.getCurrentUserId()
        );

        if (!chat) {
            throw new AppException(ChatErrors.NOT_FOUND);
        }

        return chat;
    }
}
