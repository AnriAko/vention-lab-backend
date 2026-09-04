import {
    SetMetadata,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';

import { LoggerService } from '@vention/shared-logger';

import { ROLES_KEY } from '~/common/security/constants';
import { WsAuthGuard } from '~/common/security/guards/ws-auth.guard';
import { WsOrganizationGuard } from '~/common/security/guards/ws-organization.guard';
import { WsRolesGuard } from '~/common/security/guards/ws-roles.guard';
import { AppRole } from '~/common/security/permissions/app-role.enum';

import { ChatWsExceptionFilter } from './chat-ws.exception-filter';
import { CHAT_WS_NAMESPACE } from './chat.constants';
import { ChatService } from './chat.service';
import { CHAT_WS_EVENTS } from './chat.ws.constants';
import { WsDeleteMessageSchema } from './requests/ws-delete-message.request.dto';
import { WsJoinChatSchema } from './requests/ws-join-chat.request.dto';
import { WsSendMessageSchema } from './requests/ws-send-message.request.dto';
import { WsTypingSchema } from './requests/ws-typing.request.dto';
import type {
    ChatMessageAck,
    ChatMessageDeletedPayload,
    ChatRoomJoinResult,
    ChatSocket,
    ChatTypingPayload,
} from './types/chat-ws.types';
import { buildChatRoomName } from './utils/build-chat-room-name';
import { parseInput } from './utils/parse-input';
import { WsRlsInterceptor } from './ws-rls-interceptor';

@WebSocketGateway({
    namespace: CHAT_WS_NAMESPACE,
    cors: {
        origin: true,
        credentials: true,
    },
})
@UseFilters(ChatWsExceptionFilter)
@SetMetadata(ROLES_KEY, [AppRole.USER])
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly logger: LoggerService,
        private readonly wsAuthGuard: WsAuthGuard,
        private readonly wsOrganizationGuard: WsOrganizationGuard
    ) {}

    /**
     * Authentication and organization authorization happen once
     * when the WebSocket connection is established.
     */
    async handleConnection(client: ChatSocket): Promise<void> {
        try {
            await this.wsAuthGuard.authenticate(client);
            await this.wsOrganizationGuard.authorize(client);

            client.emit(CHAT_WS_EVENTS.READY, {
                userId: client.data.user.userId,
            });

            this.logger.log(
                `[ChatGateway] connected userId=${client.data.user.userId} ` +
                    `org=${client.data.user.organizationId} sid=${client.id}`
            );
        } catch (error) {
            this.logger.warn(
                `[ChatGateway] auth failed: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );

            client.disconnect(true);
        }
    }

    handleDisconnect(client: ChatSocket): void {
        this.logger.log(`[ChatGateway] disconnected sid=${client.id}`);
    }

    /**
     * JOIN
     *
     * Transport-only: joins the Socket.IO room without a DB/RLS transaction.
     * Membership authorization for sensitive operations happens in SEND/DELETE
     * (and GraphQL) inside a single RLS transaction.
     */
    @SubscribeMessage(CHAT_WS_EVENTS.JOIN)
    @UseGuards(WsRolesGuard)
    async joinChat(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<ChatRoomJoinResult> {
        try {
            const { chatId } = parseInput(WsJoinChatSchema, body);
            const room = buildChatRoomName(chatId);

            if (!client.rooms.has(room)) {
                await client.join(room);
            }

            client.emit(CHAT_WS_EVENTS.JOINED, { chatId });

            return {
                ok: true,
                chatId,
            };
        } catch (error) {
            this.emitError(client, error);

            return {
                ok: false,
                chatId: '',
            };
        }
    }

    /**
     * MESSAGE SEND
     *
     * WsRolesGuard
     * WsRlsInterceptor (single RLS transaction)
     * Redis dedupe
     * ChatService.createMessageForUser (one membership check)
     */
    @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_SEND)
    @UseGuards(WsRolesGuard)
    @UseInterceptors(WsRlsInterceptor)
    async sendMessage(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<{ ok: boolean }> {
        try {
            const payload = parseInput(WsSendMessageSchema, body);

            const user = client.data.user;
            const room = buildChatRoomName(payload.chatId);

            const existing = await this.chatService.findDedupedRealtimeMessage(
                user,
                payload
            );

            if (existing) {
                client.emit(CHAT_WS_EVENTS.MESSAGE_ACK, {
                    chatId: payload.chatId,
                    clientMessageId: payload.clientMessageId,
                    duplicate: true,
                    message: existing,
                } satisfies ChatMessageAck);

                return { ok: true };
            }

            const message = await this.chatService.createMessageForUser({
                chatId: payload.chatId,
                content: payload.content,
                senderId: user.userId,
            });

            await this.chatService.rememberRealtimeMessageDedupe(
                user,
                payload,
                message
            );

            if (!client.rooms.has(room)) {
                await client.join(room);
            }

            client.emit(CHAT_WS_EVENTS.MESSAGE_ACK, {
                chatId: payload.chatId,
                clientMessageId: payload.clientMessageId,
                duplicate: false,
                message,
            } satisfies ChatMessageAck);

            client.to(room).emit(CHAT_WS_EVENTS.MESSAGE, message);

            return { ok: true };
        } catch (error) {
            this.emitError(client, error);

            return { ok: false };
        }
    }

    /**
     * MESSAGE DELETE
     *
     * Connection already authenticated the socket.
     * RLS and request context are applied by WsRlsInterceptor.
     *
     * WsRolesGuard
     * ChatService
     * Prisma RLS
     */
    @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_DELETE)
    @UseGuards(WsRolesGuard)
    @UseInterceptors(WsRlsInterceptor)
    async deleteMessage(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<{ ok: boolean }> {
        try {
            const { messageId } = parseInput(WsDeleteMessageSchema, body);

            const chatId =
                await this.chatService.hardDeleteOwnedMessage(messageId);

            const payload: ChatMessageDeletedPayload = {
                chatId,
                messageId,
            };

            client.emit(CHAT_WS_EVENTS.MESSAGE_DELETED, payload);

            client
                .to(buildChatRoomName(chatId))
                .emit(CHAT_WS_EVENTS.MESSAGE_DELETED, payload);

            return { ok: true };
        } catch (error) {
            this.emitError(client, error);

            return { ok: false };
        }
    }

    /**
     * TYPING
     *
     * No authentication guard.
     * No organization guard.
     * No RLS.
     * No database query.
     *
     * The socket was already authenticated when connected.
     * We only allow broadcasting to a room the socket actually joined.
     */
    @SubscribeMessage(CHAT_WS_EVENTS.TYPING)
    async typing(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<{ ok: boolean }> {
        return this.forwardTyping(CHAT_WS_EVENTS.TYPING, client, body);
    }

    /**
     * STOP_TYPING
     *
     * Same lightweight path as TYPING.
     */
    @SubscribeMessage(CHAT_WS_EVENTS.STOP_TYPING)
    async stopTyping(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<{ ok: boolean }> {
        return this.forwardTyping(CHAT_WS_EVENTS.STOP_TYPING, client, body);
    }

    private async forwardTyping(
        event: (typeof CHAT_WS_EVENTS)[keyof typeof CHAT_WS_EVENTS],
        client: ChatSocket,
        body: unknown
    ): Promise<{ ok: boolean }> {
        try {
            const payload = parseInput(WsTypingSchema, body);

            const user = client.data.user;
            const room = buildChatRoomName(payload.chatId);

            /**
             * Do not query Prisma for every typing event.
             *
             * If the socket hasn't joined this chat room,
             * it cannot broadcast typing into it.
             */
            if (!client.rooms.has(room)) {
                throw new Error('You are not a member of this chat');
            }

            const typingPayload: ChatTypingPayload = {
                chatId: payload.chatId,
                userId: user.userId,
            };

            client.to(room).emit(event, typingPayload);

            return { ok: true };
        } catch (error) {
            this.emitError(client, error);

            return { ok: false };
        }
    }

    private emitError(client: ChatSocket, error: unknown): void {
        const message =
            error instanceof Error ? error.message : 'Unexpected error';

        client.emit(CHAT_WS_EVENTS.ERROR, {
            message,
        });

        this.logger.warn(`[ChatGateway] ${message}`);
    }
}
