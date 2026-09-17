import type { Request } from 'express';

import { AuthCookie } from './auth.constants';
import type { AppRole } from './permissions/app-role.enum';
import {
    type UserSafe,
    userSelectSafe,
} from '~/infrastructure/database/selects/user.types';

export type AuthUser = {
    userId: string;
    role: AppRole;
    organizationId?: string;
};

export interface AuthRequest extends Request {
    cookies: Partial<Record<AuthCookie, string>>;
    user: AuthUser;
    organizationId?: string;
}

export type JwtPayload = {
    sub: string;
};

export const AUTH_HEADER = {
    AUTHORIZATION: 'authorization',
    ORGANIZATION_ID: 'x-organization-id',
    ORGANIZATION_ROLE: 'x-organization-role',
} as const;

export const AUTH_SCHEME = {
    BEARER: 'Bearer',
} as const;

export const AUTH_GUEST = 'anonymous';

export type UserWithPassword = UserSafe & {
    password: string;
};

export const userSelectAuth = {
    ...userSelectSafe,
    password: true,
} as const;

export { AuthCookie };
