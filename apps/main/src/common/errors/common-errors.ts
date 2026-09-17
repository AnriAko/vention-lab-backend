import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from './app-exception';

export const CommonErrors = {
    BAD_REQUEST: {
        code: 'BAD_REQUEST',
        message: 'Bad request',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    FORBIDDEN: {
        code: 'FORBIDDEN',
        message: 'Forbidden',
        statusCode: HttpStatus.FORBIDDEN,
    },
    NOT_FOUND: {
        code: 'NOT_FOUND',
        message: 'Not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
    CONFLICT: {
        code: 'CONFLICT',
        message: 'Conflict',
        statusCode: HttpStatus.CONFLICT,
    },
    VALIDATION_ERROR: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    RATE_LIMITED: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
    },
    INTERNAL_ERROR: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    },
    DATABASE_ERROR: {
        code: 'DATABASE_ERROR',
        message: 'Database error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    },
    UNIQUE_CONSTRAINT: {
        code: 'UNIQUE_CONSTRAINT',
        message: 'Unique constraint failed',
        statusCode: HttpStatus.CONFLICT,
    },
    FOREIGN_KEY_CONSTRAINT: {
        code: 'FOREIGN_KEY_CONSTRAINT',
        message: 'Foreign key constraint failed',
        statusCode: HttpStatus.BAD_REQUEST,
    },
} as const satisfies Record<string, AppErrorDefinition>;
