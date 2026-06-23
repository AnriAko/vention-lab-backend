import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, Role } from '~/common/decorators/roles.decorator';
import { AuthRequest } from '~/common/types/auth-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthRequest>();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('No user found');
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Insufficient role');
        }

        return true;
    }
}
