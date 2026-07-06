import type { UserRole } from '~/generated/prisma/enums';

export const userSelectSafe = {
    id: true,
    email: true,
    name: true,
    role: true,
    image: true,
    isDeleted: true,
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
};

export type UserWithPassword = UserSafe & {
    password: string;
};
