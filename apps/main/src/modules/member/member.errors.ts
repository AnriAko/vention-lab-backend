import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from '~/common/errors/app-exception';

export const MemberErrors = {
    NOT_FOUND: {
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
    NOT_FOUND_AFTER_ROLE_ASSIGNMENT: {
        code: 'MEMBER_NOT_FOUND_AFTER_ROLE_ASSIGNMENT',
        message: 'Member not found after role assignment',
        statusCode: HttpStatus.NOT_FOUND,
    },
} as const satisfies Record<string, AppErrorDefinition>;
