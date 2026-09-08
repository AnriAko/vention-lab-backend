import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import { AUTH_GUEST, type AuthUser } from '~/common/security/auth.types';
import type { ChatRecord } from '~/infrastructure/database/selects/chat.types';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { RedisPrefix } from '~/infrastructure/cache/redis.types';
import { AuthErrors } from '~/modules/auth/auth.errors';
import { LoggerService } from '@vention/shared-logger';

import {
    CHAT_MAX_MEMBERS,
    CHAT_WS_DEDUPLICATION_TTL_SECONDS,
} from './chat.constants';
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
import type { WsSendMessage } from './requests/ws-send-message.request.dto';
import { ChatMemberResponse } from './responses/chat-member.response';
import { ChatResponse } from './responses/chat.response';
import { MessageResponse } from './responses/message.response';
import { PaginatedChatsResponse } from './responses/paginated-chats.response';
import { PaginatedMessagesResponse } from './responses/paginated-messages.response';
import { buildMessageDedupeKey } from './utils/build-message-dedupe-key';
import { parseInput } from './utils/parse-input';
import { parsePagination } from './utils/parse-pagination';
import { toChatMemberResponse } from './utils/to-chat-member-response';
import { toChatResponse } from './utils/to-chat-response';
import { toMessageResponse } from './utils/to-message-response';

@Injectable()
export class ChatService {
    constructor(
        private readonly chatRepository: ChatRepository,
        private readonly redisService: RedisService,
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
        await this.assertChatMembership(parsedChatId);

        const members = await this.chatRepository.findMembers(parsedChatId);

        return members.map((membership) =>
            toChatMemberResponse(membership.user)
        );
    }

    async findMessages(
        args: ChatMessagesArgs
    ): Promise<PaginatedMessagesResponse> {
        const parsed = parseInput(ChatMessagesSchema, args);
        await this.assertChatMembership(parsed.chatId);

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
        await this.assertChatMembership(chatId);

        await this.chatRepository.delete(chatId);

        this.logger.log(`[ChatService] hard deleted id=${chatId}`);

        return true;
    }

    async addChatMember(input: AddChatMemberDto): Promise<ChatMemberResponse> {
        const { chatId, userId } = parseInput(AddChatMemberSchema, input);
        await this.assertChatMembership(chatId);

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
        await this.assertChatMembership(chatId);

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

        return this.createMessageForUser({
            chatId,
            content,
            senderId,
        });
    }

    async deleteMessage(id: string): Promise<boolean> {
        const messageId = parseInput(MessageIdSchema, { id }).id;
        await this.hardDeleteOwnedMessage(messageId);
        return true;
    }

    async hardDeleteOwnedMessage(messageId: string): Promise<string> {
        const currentUserId = this.getCurrentUserId();
        const message = await this.chatRepository.findMessageById(messageId);

        if (!message) {
            throw new AppException(ChatErrors.MESSAGE_NOT_FOUND);
        }

        await this.assertChatMembership(message.chatId);

        if (message.senderId !== currentUserId) {
            throw new AppException(ChatErrors.MESSAGE_DELETE_FORBIDDEN);
        }

        await this.chatRepository.deleteMessage(messageId);

        this.logger.log(`[ChatService] hard deleted message id=${messageId}`);

        return message.chatId;
    }

    async sendRealtimeMessage(
        user: AuthUser,
        input: WsSendMessage
    ): Promise<{ message: MessageResponse; duplicate: boolean }> {
        const existing = await this.findDedupedRealtimeMessage(user, input);

        if (existing) {
            return {
                message: existing,
                duplicate: true,
            };
        }

        const message = await this.createMessageForUser({
            chatId: input.chatId,
            content: input.content,
            senderId: user.userId,
        });

        await this.rememberRealtimeMessageDedupe(user, input, message);

        return {
            message,
            duplicate: false,
        };
    }

    async findDedupedRealtimeMessage(
        user: AuthUser,
        input: WsSendMessage
    ): Promise<MessageResponse | null> {
        if (!input.clientMessageId) {
            return null;
        }

        const dedupeKey = buildMessageDedupeKey({
            userId: user.userId,
            chatId: input.chatId,
            clientMessageId: input.clientMessageId,
        });

        return this.redisService.getJson<MessageResponse>(
            RedisPrefix.CHAT_MESSAGE_DEDUPE,
            dedupeKey
        );
    }

    async rememberRealtimeMessageDedupe(
        user: AuthUser,
        input: WsSendMessage,
        message: MessageResponse
    ): Promise<void> {
        if (!input.clientMessageId) {
            return;
        }

        const dedupeKey = buildMessageDedupeKey({
            userId: user.userId,
            chatId: input.chatId,
            clientMessageId: input.clientMessageId,
        });

        await this.redisService.setJson(
            RedisPrefix.CHAT_MESSAGE_DEDUPE,
            dedupeKey,
            message,
            CHAT_WS_DEDUPLICATION_TTL_SECONDS
        );
    }

    async assertMemberAccess(chatId: string, userId: string): Promise<void> {
        await this.assertChatMembershipForUser(chatId, userId);
    }

    async createMessageForUser(input: {
        chatId: string;
        content: string;
        senderId: string;
    }): Promise<MessageResponse> {
        await this.assertChatMembershipForUser(input.chatId, input.senderId);

        const message = await this.chatRepository.createMessage(
            input.chatId,
            input.senderId,
            input.content
        );

        this.logger.log(
            `[ChatService] created message id=${message.id} chatId=${input.chatId}`
        );

        return toMessageResponse(message);
    }

    async getPeerParticipantIds(
        chatId: string,
        userId: string
    ): Promise<string[]> {
        await this.assertChatMembershipForUser(chatId, userId);

        const members = await this.chatRepository.findMembers(chatId);

        return members
            .map((membership) => membership.userId)
            .filter((memberId) => memberId !== userId);
    }

    private getCurrentUserId(): string {
        const userId = requestContext.getStore()?.userId;

        if (!userId || userId === AUTH_GUEST) {
            throw new AppException(AuthErrors.MISSING_AUTHENTICATED_USER);
        }

        return userId;
    }

    private async requireChatMembership(chatId: string): Promise<ChatRecord> {
        return this.requireChatMembershipForUser(
            chatId,
            this.getCurrentUserId()
        );
    }

    private async assertChatMembership(chatId: string): Promise<void> {
        await this.assertChatMembershipForUser(chatId, this.getCurrentUserId());
    }

    private async requireChatMembershipForUser(
        chatId: string,
        userId: string
    ): Promise<ChatRecord> {
        const chat = await this.chatRepository.findByIdForUser(chatId, userId);

        if (!chat) {
            throw new AppException(ChatErrors.NOT_FOUND);
        }

        return chat;
    }

    private async assertChatMembershipForUser(
        chatId: string,
        userId: string
    ): Promise<void> {
        const chat = await this.chatRepository.findAccessibleByIdForUser(
            chatId,
            userId
        );

        if (!chat) {
            throw new AppException(ChatErrors.NOT_FOUND);
        }
    }
}
