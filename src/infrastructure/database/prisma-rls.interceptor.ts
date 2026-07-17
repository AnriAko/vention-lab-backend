import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, Observable, lastValueFrom } from 'rxjs';

import {
    IS_PUBLIC_KEY,
    SKIP_ORGANIZATION_KEY,
} from '~/common/decorators/constants';
import { AUTH_GUEST } from '~/common/types/auth.types';
import { requestContext } from '~/infrastructure/context/request-context';
import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';

/**
 * Wraps authenticated tenant handlers (including OWNER acting in an org)
 * in a single RLS transaction:
 * BEGIN → set_config(app.current_*) → handler → COMMIT
 *
 * Registered as APP_INTERCEPTOR in GlobalModule so it always runs after
 * AuthGuard / OrganizationGuard / RolesGuard have populated RequestContext.
 *
 * Skips only public routes and @SkipOrganization (platform) routes.
 * Does not special-case OWNER — owners with x-organization-id still get RLS.
 */
@Injectable()
export class PrismaRlsInterceptor implements NestInterceptor {
    constructor(
        private readonly prismaRls: PrismaRlsService,
        private readonly reflector: Reflector
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic) {
            return next.handle();
        }

        const skipOrganization = this.reflector.getAllAndOverride<boolean>(
            SKIP_ORGANIZATION_KEY,
            [context.getHandler(), context.getClass()]
        );

        // Platform OWNER org CRUD etc. — use PrismaService, not RLS
        if (skipOrganization) {
            return next.handle();
        }

        const store = requestContext.getStore();

        // Tenant RLS requires authenticated user + organization context.
        // OWNER tenant access is included when OrganizationGuard set both.
        if (
            !store?.userId ||
            store.userId === AUTH_GUEST ||
            !store.organizationId ||
            !store.role
        ) {
            return next.handle();
        }

        return from(this.prismaRls.withRls(() => lastValueFrom(next.handle())));
    }
}
