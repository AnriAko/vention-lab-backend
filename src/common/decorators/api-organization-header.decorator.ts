import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';

import { SWAGGER_AUTH } from '~/common/swagger/swagger.constants';
import { SEED_ORGANIZATIONS } from '~/common/swagger/seed-examples';
import { AUTH_HEADER } from '~/common/types/auth.types';

export const ApiOrganizationHeader = () =>
    applyDecorators(
        ApiSecurity(SWAGGER_AUTH.ORGANIZATION_ID),
        ApiHeader({
            name: AUTH_HEADER.ORGANIZATION_ID,
            description:
                'Active organization UUID. Seeded CatFans example works after `prisma:seed`.',
            required: true,
            example: SEED_ORGANIZATIONS.catFans.id,
            schema: { type: 'string', format: 'uuid' },
        })
    );
