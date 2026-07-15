import type { Request } from 'express';
import type { UserRole } from '~/generated/prisma/enums';
import type { AuthCookie } from '~/modules/auth/auth.constants';

export type AuthUser = {
    userId: string;
    role: UserRole;
    organizationId?: string;
};

export interface AuthRequest extends Request {
    cookies: Partial<Record<AuthCookie, string>>;
    user: AuthUser;
    organizationId?: string;
}

export type JwtPayload = {
    sub: string;
    role: UserRole;
};

export const AUTH_COOKIE = {
    REFRESH_TOKEN: 'refreshToken',
} as const;

export const AUTH_HEADER = {
    AUTHORIZATION: 'authorization',
    ORGANIZATION_ID: 'x-organization-id',
} as const;

export const AUTH_SCHEME = {
    BEARER: 'Bearer',
} as const;

export const AUTH_GUEST = 'anonymous';
