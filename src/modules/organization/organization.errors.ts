import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from '~/common/errors';

export const OrganizationErrors = {
    NOT_FOUND: {
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
    MISSING_ORGANIZATION: {
        code: 'ORGANIZATION_MISSING',
        message: 'Missing organization',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    MISSING_ORGANIZATION_ROLE: {
        code: 'ORGANIZATION_ROLE_MISSING',
        message: 'Missing organization role',
        statusCode: HttpStatus.UNAUTHORIZED,
    },
    INVALID_ORGANIZATION_ROLE: {
        code: 'ORGANIZATION_ROLE_INVALID',
        message: 'Invalid organization role',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    ACCESS_DENIED: {
        code: 'ORGANIZATION_ACCESS_DENIED',
        message: 'Access denied',
        statusCode: HttpStatus.FORBIDDEN,
    },
} as const satisfies Record<string, AppErrorDefinition>;
