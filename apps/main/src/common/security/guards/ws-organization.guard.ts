import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppException } from '~/common/errors/app-exception';
import type { AuthUser } from '~/common/security/auth.types';
import {
    IS_PUBLIC_KEY,
    SKIP_ORGANIZATION_KEY,
} from '~/common/security/constants';
import {
    assertClaimedOrganizationRole,
    authorizeOrganizationAccess,
} from '~/common/security/utils/authorize-organization-access';
import { getWsClient } from '~/common/security/utils/execution-context';
import {
    extractWsOrganizationId,
    extractWsOrganizationRole,
    getWsClientUser,
    setWsClientUser,
} from '~/common/security/utils/ws-handshake';
import type { WsHandshakeClient } from '~/common/security/ws-client.types';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { OrganizationErrors } from '~/modules/organization/organization.errors';

@Injectable()
export class WsOrganizationGuard implements CanActivate {
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

        await this.authorize(getWsClient(context));
        return true;
    }

    async authorize(client: WsHandshakeClient): Promise<AuthUser> {
        const organizationId = extractWsOrganizationId(client);
        const claimedRole = extractWsOrganizationRole(client);

        if (!organizationId) {
            throw new AppException(OrganizationErrors.MISSING_ORGANIZATION);
        }

        assertClaimedOrganizationRole(claimedRole, false);

        const user = await authorizeOrganizationAccess(
            this.prisma,
            getWsClientUser(client),
            organizationId
        );

        setWsClientUser(client, user);
        return user;
    }
}
