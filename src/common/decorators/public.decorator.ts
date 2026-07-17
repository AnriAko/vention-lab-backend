import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

import { IS_PUBLIC_KEY } from '~/common/decorators/constants';

/**
 * Guest / anonymous route: skips Auth, Organization, and Roles guards.
 * OpenAPI: marked with `x-guest: true` (no Bearer / org header required).
 */
export const PublicRoute = () =>
    applyDecorators(
        SetMetadata(IS_PUBLIC_KEY, true),
        ApiExtension('x-guest', true)
    );
