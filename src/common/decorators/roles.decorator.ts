import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiExtension } from '@nestjs/swagger';

import { ROLES_KEY } from '~/common/decorators/constants';
import { SWAGGER_AUTH } from '~/common/swagger/swagger.constants';
import { AppRole } from '~/common/types/app-role.enum';

export const Roles = (...roles: AppRole[]) => {
    const required = roles.length ? roles : [AppRole.USER];

    return applyDecorators(
        SetMetadata(ROLES_KEY, required),
        ApiBearerAuth(SWAGGER_AUTH.ACCESS_TOKEN),
        ApiExtension('x-required-roles', required)
    );
};
