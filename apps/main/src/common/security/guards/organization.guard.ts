import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppException } from '~/common/errors/app-exception';
import { AUTH_HEADER, AuthRequest } from '~/common/security/auth.types';
import {
    IS_PUBLIC_KEY,
    SKIP_ORGANIZATION_KEY,
} from '~/common/security/constants';
import {
    assertClaimedOrganizationRole,
    authorizeOrganizationAccess,
} from '~/common/security/utils/authorize-organization-access';
import {
    getRequest,
    isWsContext,
} from '~/common/security/utils/execution-context';
import { setRequestOrganization } from '~/common/tenancy/organization/organization-context';
import {
    setRequestRole,
    setRequestUser,
} from '~/common/tenancy/user/user-context';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { OrganizationErrors } from '~/modules/organization/organization.errors';

@Injectable()
export class OrganizationGuard implements CanActivate {
    constructor(
        private readonly prisma: PrismaService,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (isWsContext(context)) {
            return true;
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic) {
            return true;
        }

        const skipOrganization = this.reflector.getAllAndOverride<boolean>(
            SKIP_ORGANIZATION_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (skipOrganization) {
            return true;
        }

        const request = getRequest(context);
        const organizationId = this.readHeader(
            request,
            AUTH_HEADER.ORGANIZATION_ID
        );
        const claimedRole = this.readHeader(
            request,
            AUTH_HEADER.ORGANIZATION_ROLE
        );

        if (!organizationId) {
            throw new AppException(OrganizationErrors.MISSING_ORGANIZATION);
        }

        assertClaimedOrganizationRole(claimedRole, true);

        request.user = await authorizeOrganizationAccess(
            this.prisma,
            request.user,
            organizationId
        );

        setRequestUser(request.user.userId);
        setRequestOrganization(organizationId);
        setRequestRole(request.user.role);

        return true;
    }

    private readHeader(
        request: AuthRequest,
        headerName: string
    ): string | undefined {
        const value = request.headers[headerName];
        return Array.isArray(value) ? value[0] : value;
    }
}
