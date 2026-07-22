import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
    IS_PUBLIC_KEY,
    SKIP_ORGANIZATION_KEY,
} from '~/common/security/constants';
import { AppException } from '~/common/errors';
import { AUTH_HEADER, AuthRequest } from '~/common/security/auth.types';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import { OrganizationRole } from '~/generated/prisma/enums';

import { PrismaService } from '~/infrastructure/database/prisma.service';
import { AuthErrors } from '~/modules/auth/auth.errors';
import { OrganizationErrors } from '~/modules/organization/organization.errors';
import {
    setRequestRole,
    setRequestUser,
} from '~/common/tenancy/user/user-context';
import { setRequestOrganization } from '~/common/tenancy/organization/organization-context';

@Injectable()
export class OrganizationGuard implements CanActivate {
    constructor(
        private readonly prisma: PrismaService,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
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

        const request = context.switchToHttp().getRequest<AuthRequest>();

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

        if (!claimedRole) {
            throw new AppException(
                OrganizationErrors.MISSING_ORGANIZATION_ROLE
            );
        }

        if (
            claimedRole !== OrganizationRole.USER &&
            claimedRole !== OrganizationRole.ADMIN
        ) {
            throw new AppException(
                OrganizationErrors.INVALID_ORGANIZATION_ROLE
            );
        }

        if (!request.user?.userId) {
            throw new AppException(AuthErrors.MISSING_AUTHENTICATED_USER);
        }

        const platformRole = request.user.role;

        if (platformRole === AppRole.OWNER) {
            const organization = await this.prisma.organization.findUnique({
                where: {
                    id: organizationId,
                    isDeleted: false,
                },
                select: { id: true },
            });

            if (!organization) {
                throw new AppException(OrganizationErrors.ACCESS_DENIED);
            }

            request.user.organizationId = organizationId;
            request.user.role = AppRole.OWNER;

            setRequestUser(request.user.userId);
            setRequestOrganization(organizationId);
            setRequestRole(AppRole.OWNER);

            return true;
        }

        const membership = await this.prisma.usersOrganizations.findUnique({
            where: {
                userId_organizationId: {
                    userId: request.user.userId,
                    organizationId,
                },
            },
        });

        if (!membership) {
            throw new AppException(OrganizationErrors.ACCESS_DENIED);
        }

        const orgRole = await this.prisma.usersOrganizationsRoles.findUnique({
            where: {
                userId_organizationId: {
                    userId: request.user.userId,
                    organizationId,
                },
            },
        });

        if (!orgRole) {
            throw new AppException(OrganizationErrors.ACCESS_DENIED);
        }

        // Header role is a client context hint only — authorize from DB.
        const membershipRole = orgRole.role as AppRole;

        request.user.organizationId = organizationId;
        request.user.role = membershipRole;

        setRequestUser(request.user.userId);
        setRequestOrganization(organizationId);
        setRequestRole(membershipRole);

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
