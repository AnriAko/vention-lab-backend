import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY, ROLES_KEY } from '~/common/security/constants';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import {
    getRequest,
    isWsContext,
} from '~/common/security/utils/execution-context';
import { hasRequiredRole } from '~/common/security/utils/has-required-role';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
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

        const roles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!roles?.length) {
            return true;
        }

        const request = getRequest(context);

        if (!request.user) {
            return false;
        }

        return hasRequiredRole(request.user.role, roles);
    }
}
