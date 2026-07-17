import { applyDecorators } from '@nestjs/common';
import { ApiOperation, type ApiOperationOptions } from '@nestjs/swagger';

type OperationInput = Omit<ApiOperationOptions, 'security'>;

function roleLine(roles?: string[]): string {
    if (!roles?.length) {
        return '';
    }
    return `\n\n**Required role (minimum):** \`${roles.join('` | `')}\``;
}

/**
 * Standard operation docs. Pass `guest: true` to clear global security (public routes).
 */
export function ApiEndpoint(
    options: OperationInput & {
        guest?: boolean;
        roles?: string[];
    }
) {
    const { guest, roles, description, ...rest } = options;
    const roleNote = roleLine(roles);
    const guestNote = guest
        ? '\n\n**Access:** Guest — no authentication required (`@PublicRoute`).'
        : '';

    return applyDecorators(
        ApiOperation({
            ...rest,
            description: `${description ?? ''}${guestNote}${roleNote}`.trim(),
            ...(guest ? { security: [] } : {}),
        })
    );
}
