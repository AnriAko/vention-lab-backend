import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '~/common/decorators/constants';

import { AuthRequest } from '~/common/types/auth.types';
import { UserRole } from '~/generated/prisma/enums';

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

        const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
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
        if (request.user.role === UserRole.OWNER) {
            return true;
        }

        return roles.includes(request.user.role);
    }
}
