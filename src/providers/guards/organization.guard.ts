import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
    IS_PUBLIC_KEY,
    SKIP_ORGANIZATION_KEY,
} from '~/common/decorators/constants';
import { AUTH_HEADER, AuthRequest } from '~/common/types/auth.types';
import {
    setRequestOrganization,
    setRequestUser,
} from '~/infrastructure/context/request-context';
import { PrismaService } from '~/infrastructure/database/prisma.service';

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

        const organizationIdHeader =
            request.headers[AUTH_HEADER.ORGANIZATION_ID];
        const organizationId = Array.isArray(organizationIdHeader)
            ? organizationIdHeader[0]
            : organizationIdHeader;

        if (!organizationId) {
            throw new UnauthorizedException('Missing organization');
        }

        if (!request.user?.userId) {
            throw new UnauthorizedException('Missing authenticated user');
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
            throw new ForbiddenException('Access denied');
        }

        request.user.organizationId = organizationId;

        setRequestUser(request.user.userId);
        setRequestOrganization(organizationId);

        return true;
    }
}
