import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiExtension } from '@nestjs/swagger';

import { SKIP_ORGANIZATION_KEY } from '~/common/security/constants';
import { SWAGGER_AUTH } from '~/common/api';

export const SkipOrganization = () =>
    applyDecorators(
        SetMetadata(SKIP_ORGANIZATION_KEY, true),
        ApiBearerAuth(SWAGGER_AUTH.ACCESS_TOKEN),
        ApiExtension('x-skip-organization', true)
    );
