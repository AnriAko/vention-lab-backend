import type { UserRole } from '~/generated/prisma/enums';

export const userSelectSafe = {
    id: true,
    email: true,
    name: true,
    role: true,
    image: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
} as const;

export const userSelectAuth = {
    ...userSelectSafe,
    password: true,
} as const;

export type UserSafe = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    image: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type UserWithPassword = UserSafe & {
    password: string;
};

export type UserCursor = {
    createdAt: Date;
    id: string;
};