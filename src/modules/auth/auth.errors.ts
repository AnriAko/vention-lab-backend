import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from '~/common/errors';

export const AuthErrors = {
    INVALID_CREDENTIALS: {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    MISSING_ACCESS_TOKEN: {
        code: 'AUTH_MISSING_ACCESS_TOKEN',
        message: 'Missing access token',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    INVALID_TOKEN_PAYLOAD: {
        code: 'AUTH_INVALID_TOKEN_PAYLOAD',
        message: 'Invalid token payload',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    TOKEN_REVOKED: {
        code: 'AUTH_TOKEN_REVOKED',
        message: 'Token revoked',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    INVALID_OR_EXPIRED_TOKEN: {
        code: 'AUTH_INVALID_OR_EXPIRED_TOKEN',
        message: 'Invalid or expired token',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    MISSING_AUTHENTICATED_USER: {
        code: 'AUTH_MISSING_AUTHENTICATED_USER',
        message: 'Missing authenticated user',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
} as const satisfies Record<string, AppErrorDefinition>;
