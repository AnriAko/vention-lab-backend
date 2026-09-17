import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from '~/common/errors/app-exception';

export const UserErrors = {
    NOT_FOUND: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
} as const satisfies Record<string, AppErrorDefinition>;
