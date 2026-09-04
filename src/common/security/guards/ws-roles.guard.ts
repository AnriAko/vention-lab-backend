import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY, ROLES_KEY } from '~/common/security/constants';
import { AppRole } from '~/common/security/permissions/app-role.enum';
import { getWsClient } from '~/common/security/utils/execution-context';
import { hasRequiredRole } from '~/common/security/utils/has-required-role';
import { getWsClientUser } from '~/common/security/utils/ws-handshake';

@Injectable()
export class WsRolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

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

        if (!roles?.length) {
            return true;
        }

        const user = getWsClientUser(getWsClient(context));

        if (!user) {
            return false;
        }

        return hasRequiredRole(user.role, roles);
    }
}
