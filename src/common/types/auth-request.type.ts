import type { Request } from 'express';
import type { AuthCookie } from '~/modules/auth/auth.constants';

export type AuthUser = {
    userId: string;
    role: 'user' | 'admin';
};

export interface AuthRequest extends Request {
    cookies: Partial<Record<AuthCookie, string>>;
    user: AuthUser;
}
