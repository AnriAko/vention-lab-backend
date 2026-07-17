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
    ACCESS_DENIED: {
        code: 'ORGANIZATION_ACCESS_DENIED',
        message: 'Access denied',
        statusCode: HttpStatus.FORBIDDEN,
    },
} as const satisfies Record<string, AppErrorDefinition>;
