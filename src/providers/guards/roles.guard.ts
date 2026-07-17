import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '~/common/decorators/constants';

import { AuthRequest } from '~/common/types/auth.types';
import { AppRole } from '~/common/types/app-role.enum';

const ROLE_RANK: Record<AppRole, number> = {
    [AppRole.USER]: 1,
    [AppRole.ADMIN]: 2,
    [AppRole.OWNER]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic) {
            return true;
        }

        const roles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest<AuthRequest>();

        if (!roles?.length) {
            return true;
        }

        if (!request.user) {
            return false;
        }

        // Tenant routes: role is membership role for x-organization-id (set by OrganizationGuard)
        const activeRole = request.user.role;
        const requiredRank = Math.min(...roles.map((role) => ROLE_RANK[role]));

        return ROLE_RANK[activeRole] >= requiredRank;
    }
}
