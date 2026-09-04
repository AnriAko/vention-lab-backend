import { Injectable } from '@nestjs/common';

import { paginatePrisma } from '~/common/api/pagination/paginate-prisma';
import type { Pagination } from '~/common/api/pagination/pagination.schema';
import type { PaginatedResult } from '~/common/api/pagination/pagination.types';
import { SortDirection } from '~/common/api/pagination/sort-order.enum';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { getActiveOrgId } from '~/common/tenancy/organization/organization-context';
import { addWhere } from '~/infrastructure/database/scopes/addWhere';
import { activeTenantScope } from '~/infrastructure/database/scopes/organization-scope';
import { organizationUserScope } from '~/infrastructure/database/scopes/user-scope';
import {
    chatSelect,
    chatUsersSelect,
    messageSelect,
} from '~/infrastructure/database/selects/chat.types';
import type {
    ChatRecord,
    ChatUserRecord,
    MessageRecord,
} from '~/infrastructure/database/selects/chat.types';

@Injectable()
export class ChatRepository {
    constructor(private readonly prisma: PrismaRlsClient) {}

    findByIdForUser(id: string, userId: string): Promise<ChatRecord | null> {
        return this.prisma.chat.findFirst({
            where: addWhere(activeTenantScope(), {
                id,
                users: {
                    some: {
                        userId,
                    },
                },
            }),
            select: chatSelect,
        });
    }

    findAllForUser(
        userId: string,
        pagination: Pagination
    ): Promise<PaginatedResult<ChatRecord>> {
        return paginatePrisma({
            pagination,
            model: this.prisma.chat,
            where: addWhere(activeTenantScope(), {
                users: {
                    some: {
                        userId,
                    },
                },
            }),
            select: chatSelect,
            orderBy: {
                id: SortDirection.DESC,
            },
        }) as Promise<PaginatedResult<ChatRecord>>;
    }

    findDirectChat(
        userIdA: string,
        userIdB: string
    ): Promise<ChatRecord | null> {
        return this.prisma.chat.findFirst({
            where: addWhere(activeTenantScope(), {
                AND: [
                    {
                        users: {
                            some: {
                                userId: userIdA,
                            },
                        },
                    },
                    {
                        users: {
                            some: {
                                userId: userIdB,
                            },
                        },
                    },
                ],
            }),
            select: chatSelect,
        });
    }

    findOrganizationMember(userId: string): Promise<{ id: string } | null> {
        return this.prisma.user.findFirst({
            where: addWhere(organizationUserScope(), {
                id: userId,
            }),
            select: {
                id: true,
            },
        });
    }

    findMembers(chatId: string): Promise<ChatUserRecord[]> {
        return this.prisma.usersChats.findMany({
            where: {
                chatId,
                chat: activeTenantScope(),
            },
            select: chatUsersSelect,
        });
    }

    async isMember(chatId: string, userId: string): Promise<boolean> {
        const membership = await this.prisma.usersChats.findUnique({
            where: {
                userId_chatId: {
                    userId,
                    chatId,
                },
            },
            select: {
                userId: true,
            },
        });

        return Boolean(membership);
    }

    countMembers(chatId: string): Promise<number> {
        return this.prisma.usersChats.count({
            where: {
                chatId,
            },
        });
    }

    create(currentUserId: string, otherUserId: string): Promise<ChatRecord> {
        return this.prisma.chat.create({
            data: {
                organizationId: getActiveOrgId(),
                users: {
                    create: [
                        {
                            userId: currentUserId,
                        },
                        {
                            userId: otherUserId,
                        },
                    ],
                },
            },
            select: chatSelect,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.chat.delete({
            where: {
                id,
            },
        });
    }

    addMember(chatId: string, userId: string): Promise<ChatUserRecord> {
        return this.prisma.usersChats.create({
            data: {
                chatId,
                userId,
            },
            select: chatUsersSelect,
        });
    }

    async removeMember(chatId: string, userId: string): Promise<void> {
        await this.prisma.usersChats.delete({
            where: {
                userId_chatId: {
                    userId,
                    chatId,
                },
            },
        });
    }

    findMessages(
        chatId: string,
        pagination: Pagination
    ): Promise<PaginatedResult<MessageRecord>> {
        return paginatePrisma({
            pagination,
            model: this.prisma.message,
            where: {
                chatId,
            },
            select: messageSelect,
            orderBy: {
                createdAt: SortDirection.DESC,
            },
        }) as Promise<PaginatedResult<MessageRecord>>;
    }

    findMessageById(id: string): Promise<MessageRecord | null> {
        return this.prisma.message.findFirst({
            where: {
                id,
                chat: activeTenantScope(),
            },
            select: messageSelect,
        });
    }

    createMessage(
        chatId: string,
        senderId: string,
        content: string
    ): Promise<MessageRecord> {
        return this.prisma.message.create({
            data: {
                chatId,
                senderId,
                content,
            },
            select: messageSelect,
        });
    }

    async deleteMessage(id: string): Promise<void> {
        await this.prisma.message.delete({
            where: {
                id,
            },
        });
    }
}
