import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiExtension } from '@nestjs/swagger';

import { SKIP_ORGANIZATION_KEY } from '~/common/decorators/constants';
import { SWAGGER_AUTH } from '~/common/swagger/swagger.constants';

/**
 * Authenticated route that does not require `x-organization-id` (no tenant RLS wrap).
 * Still requires JWT unless combined with `@PublicRoute()`.
 */
export const SkipOrganization = () =>
    applyDecorators(
        SetMetadata(SKIP_ORGANIZATION_KEY, true),
        ApiBearerAuth(SWAGGER_AUTH.ACCESS_TOKEN),
        ApiExtension('x-skip-organization', true)
    );
