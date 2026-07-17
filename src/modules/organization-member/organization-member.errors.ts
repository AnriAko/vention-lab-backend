import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from '~/common/errors';

export const OrganizationMemberErrors = {
    NOT_FOUND: {
        code: 'ORGANIZATION_MEMBER_NOT_FOUND',
        message: 'Organization member not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
    NOT_FOUND_AFTER_ROLE_ASSIGNMENT: {
        code: 'ORGANIZATION_MEMBER_NOT_FOUND_AFTER_ROLE_ASSIGNMENT',
        message: 'Member not found after role assignment',
        statusCode: HttpStatus.NOT_FOUND,
    },
} as const satisfies Record<string, AppErrorDefinition>;
