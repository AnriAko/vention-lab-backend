import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';

import { SWAGGER_AUTH, SEED_ORGANIZATIONS } from '~/common/api';
import { AUTH_HEADER } from '~/common/security/auth.types';
import { OrganizationRole } from '~/generated/prisma/enums';

export const ApiOrganizationHeader = () =>
    applyDecorators(
        ApiSecurity(SWAGGER_AUTH.ORGANIZATION_ID),
        ApiSecurity(SWAGGER_AUTH.ORGANIZATION_ROLE),
        ApiHeader({
            name: AUTH_HEADER.ORGANIZATION_ID,
            description:
                'Active organization UUID. Seeded CatFans example works after `prisma:seed`.',
            required: true,
            example: SEED_ORGANIZATIONS.catFans.id,
            schema: { type: 'string', format: 'uuid' },
        }),
        ApiHeader({
            name: AUTH_HEADER.ORGANIZATION_ROLE,
            description:
                'Client organization role context hint (`USER` | `ADMIN`). Backend always verifies the real role from the database.',
            required: true,
            example: OrganizationRole.ADMIN,
            schema: {
                type: 'string',
                enum: [OrganizationRole.USER, OrganizationRole.ADMIN],
            },
        })
    );
