import type { Request } from 'express';
import type { UserRole } from '~/generated/prisma/enums';
import type { AuthCookie } from '~/modules/auth/auth.constants';

export type AuthUser = {
    userId: string;
    role: UserRole;
};

export interface AuthRequest extends Request {
    cookies: Partial<Record<AuthCookie, string>>;
    user: AuthUser;
}
