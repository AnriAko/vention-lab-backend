import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

import { IS_PUBLIC_KEY } from '~/common/security/constants';

export const PublicRoute = () =>
    applyDecorators(
        SetMetadata(IS_PUBLIC_KEY, true),
        ApiExtension('x-guest', true)
    );
