import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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

import { AUTH_HEADER, type JwtPayload } from '~/common/security/auth.types';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import { extractBearerToken } from '~/common/security/utils/extract-bearer-token';
import { PrismaRlsService } from '~/common/tenancy/rls/prisma-rls.service';
import { jwtConfig } from '~/config/configuration/jwt.config';
import { OrganizationRole } from '~/generated/prisma/enums';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { RedisPrefix } from '~/infrastructure/cache/redis.types';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { LoggerService } from '~/shared/logger';

import {
    CHAT_WS_DEDUPLICATION_TTL_SECONDS,
    CHAT_WS_NAMESPACE,
} from './chat.constants';
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
    ChatSocketAuth,
    ChatTypingPayload,
} from './types/chat-ws.types';
import { buildChatRoomName } from './utils/build-chat-room-name';
import { buildMessageDedupeKey } from './utils/build-message-dedupe-key';
import { parseInput } from './utils/parse-input';

@WebSocketGateway({
    namespace: CHAT_WS_NAMESPACE,
    cors: {
        origin: true,
        credentials: true,
    },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService,
        private readonly prisma: PrismaService,
        private readonly prismaRls: PrismaRlsService,
        private readonly chatService: ChatService,
        private readonly logger: LoggerService,
        @Inject(jwtConfig.KEY)
        private readonly jwtConf: ConfigType<typeof jwtConfig>
    ) {}

    async handleConnection(client: ChatSocket): Promise<void> {
        try {
            const auth = (client.handshake.auth ?? {}) as ChatSocketAuth;
            const token =
                auth.token ??
                extractBearerToken(
                    client.handshake.headers[AUTH_HEADER.AUTHORIZATION] as
                        string | undefined
                );
            const organizationId =
                auth.organizationId ??
                (client.handshake.headers[AUTH_HEADER.ORGANIZATION_ID] as
                    string | undefined) ??
                (client.handshake.query.organizationId as string | undefined);

            if (!token || !organizationId) {
                client.disconnect(true);
                return;
            }

            const isBlacklisted = await this.redisService.exists(
                RedisPrefix.INVALID_TOKEN,
                token
            );

            if (isBlacklisted) {
                client.disconnect(true);
                return;
            }

            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                token,
                {
                    secret: this.jwtConf.secret,
                }
            );

            if (!payload?.sub) {
                client.disconnect(true);
                return;
            }

            const role = await this.resolveSocketRole(
                payload.sub,
                organizationId
            );

            client.data.userId = payload.sub;
            client.data.organizationId = organizationId;
            client.data.role = role;

            client.emit(CHAT_WS_EVENTS.READY, {
                userId: payload.sub,
            });

            this.logger.log(
                `[ChatGateway] connected userId=${payload.sub} org=${organizationId} sid=${client.id}`
            );
        } catch (error) {
            this.logger.warn(
                `[ChatGateway] auth failed: ${error instanceof Error ? error.message : String(error)}`
            );
            client.disconnect(true);
        }
    }

    handleDisconnect(client: ChatSocket): void {
        this.logger.log(`[ChatGateway] disconnected sid=${client.id}`);
    }

    @SubscribeMessage(CHAT_WS_EVENTS.JOIN)
    async joinChat(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<ChatRoomJoinResult> {
        try {
            const { chatId } = parseInput(WsJoinChatSchema, body);

            await this.runAsSocketTenant(client, () =>
                this.chatService.assertMemberAccess(chatId, client.data.userId)
            );

            await client.join(buildChatRoomName(chatId));

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

    @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_SEND)
    async sendMessage(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<{ ok: boolean }> {
        try {
            const payload = parseInput(WsSendMessageSchema, body);
            const room = buildChatRoomName(payload.chatId);

            await this.runAsSocketTenant(client, () =>
                this.chatService.assertMemberAccess(
                    payload.chatId,
                    client.data.userId
                )
            );

            const dedupeKey = payload.clientMessageId
                ? buildMessageDedupeKey({
                      userId: client.data.userId,
                      chatId: payload.chatId,
                      clientMessageId: payload.clientMessageId,
                  })
                : undefined;

            let duplicate = false;
            let message = dedupeKey
                ? await this.redisService.getJson<ChatMessageAck['message']>(
                      RedisPrefix.CHAT_MESSAGE_DEDUPE,
                      dedupeKey
                  )
                : null;

            if (!message) {
                message = await this.runAsSocketTenant(client, () =>
                    this.chatService.createMessageForUser({
                        chatId: payload.chatId,
                        content: payload.content,
                        senderId: client.data.userId,
                    })
                );

                if (dedupeKey) {
                    await this.redisService.setJson(
                        RedisPrefix.CHAT_MESSAGE_DEDUPE,
                        dedupeKey,
                        message,
                        CHAT_WS_DEDUPLICATION_TTL_SECONDS
                    );
                }
            } else {
                duplicate = true;
            }

            client.emit(CHAT_WS_EVENTS.MESSAGE_ACK, {
                chatId: payload.chatId,
                clientMessageId: payload.clientMessageId,
                duplicate,
                message,
            } satisfies ChatMessageAck);

            client.to(room).emit(CHAT_WS_EVENTS.MESSAGE, message);

            return { ok: true };
        } catch (error) {
            this.emitError(client, error);
            return { ok: false };
        }
    }

    @SubscribeMessage(CHAT_WS_EVENTS.MESSAGE_DELETE)
    async deleteMessage(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<{ ok: boolean }> {
        try {
            const { messageId } = parseInput(WsDeleteMessageSchema, body);
            const chatId = await this.runAsSocketTenant(client, () =>
                this.chatService.hardDeleteOwnedMessage(messageId)
            );

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

    @SubscribeMessage(CHAT_WS_EVENTS.TYPING)
    async typing(
        @ConnectedSocket() client: ChatSocket,
        @MessageBody() body: unknown
    ): Promise<{ ok: boolean }> {
        return this.forwardTyping(CHAT_WS_EVENTS.TYPING, client, body);
    }

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

            const peerIds = await this.runAsSocketTenant(client, () =>
                this.chatService.getPeerParticipantIds(
                    payload.chatId,
                    client.data.userId
                )
            );

            const room = buildChatRoomName(payload.chatId);
            const typingPayload: ChatTypingPayload = {
                chatId: payload.chatId,
                userId: client.data.userId,
            };

            client.to(room).emit(event, typingPayload);

            if (peerIds.length > 1) {
                this.logger.warn(
                    `[ChatGateway] room has unexpected peers chatId=${payload.chatId} count=${peerIds.length}`
                );
            }

            return { ok: true };
        } catch (error) {
            this.emitError(client, error);
            return { ok: false };
        }
    }

    private async resolveSocketRole(
        userId: string,
        organizationId: string
    ): Promise<AppRole> {
        const owner = await this.prisma.owner.findUnique({
            where: {
                userId,
            },
            select: {
                userId: true,
            },
        });

        if (owner) {
            const organization = await this.prisma.organization.findUnique({
                where: {
                    id: organizationId,
                    isDeleted: false,
                },
                select: {
                    id: true,
                },
            });

            if (!organization) {
                throw new Error('Access denied for organization');
            }

            return AppRole.OWNER;
        }

        const membership = await this.prisma.usersOrganizations.findFirst({
            where: {
                userId,
                organizationId,
                isDeleted: false,
            },
            select: {
                userId: true,
            },
        });

        if (!membership) {
            throw new Error('Access denied for organization');
        }

        const role = await this.prisma.usersOrganizationsRoles.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            select: {
                role: true,
            },
        });

        if (!role) {
            throw new Error('Missing organization role');
        }

        return role.role === OrganizationRole.ADMIN
            ? AppRole.ADMIN
            : AppRole.USER;
    }

    private runAsSocketTenant<T>(
        client: ChatSocket,
        callback: () => Promise<T>
    ): Promise<T> {
        return this.prismaRls.withTenant(
            {
                userId: client.data.userId,
                organizationId: client.data.organizationId,
                role: client.data.role,
            },
            callback
        );
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
