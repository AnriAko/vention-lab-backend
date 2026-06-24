import type { UserRole } from '~/generated/prisma/enums';

export const userSelectSafe = {
    id: true,
    email: true,
    name: true,
    role: true,
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
};

export type UserWithPassword = UserSafe & {
    password: string;
};
