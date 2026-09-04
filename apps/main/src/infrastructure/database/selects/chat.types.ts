import type { Prisma } from '~/generated/prisma/client';

export const chatMemberUserSelect = {
    id: true,
    email: true,
    name: true,
    image: true,
} as const;

export const chatUsersSelect = {
    userId: true,
    user: {
        select: chatMemberUserSelect,
    },
} as const;

export const chatSelect = {
    id: true,
    organizationId: true,
    users: {
        select: chatUsersSelect,
    },
} as const;

export const messageSelect = {
    id: true,
    chatId: true,
    senderId: true,
    content: true,
    createdAt: true,
    sender: {
        select: chatMemberUserSelect,
    },
} as const;

export type ChatMemberUser = Prisma.UserGetPayload<{
    select: typeof chatMemberUserSelect;
}>;

export type ChatUserRecord = Prisma.UsersChatsGetPayload<{
    select: typeof chatUsersSelect;
}>;

export type ChatRecord = Prisma.ChatGetPayload<{
    select: typeof chatSelect;
}>;

export type MessageRecord = Prisma.MessageGetPayload<{
    select: typeof messageSelect;
}>;
