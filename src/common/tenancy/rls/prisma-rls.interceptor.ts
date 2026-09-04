import { CallHandler, Injectable, NestInterceptor } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, lastValueFrom, type Observable } from 'rxjs';

import { AUTH_GUEST } from '~/common/security/auth.types';
import {
    IS_PUBLIC_KEY,
    SKIP_ORGANIZATION_KEY,
} from '~/common/security/constants';
import {
    getWsClient,
    isWsContext,
} from '~/common/security/utils/execution-context';
import { getWsClientUser } from '~/common/security/utils/ws-handshake';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { PrismaRlsService } from '~/common/tenancy/rls/prisma-rls.service';

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

        if (skipOrganization) {
            return next.handle();
        }

        if (isWsContext(context)) {
            return this.interceptWs(context, next);
        }

        const store = requestContext.getStore();

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

    private interceptWs(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        const user = getWsClientUser(getWsClient(context));

        if (!user?.userId || !user.organizationId || !user.role) {
            return next.handle();
        }

        return from(
            this.prismaRls.withTenant(
                {
                    userId: user.userId,
                    organizationId: user.organizationId,
                    role: user.role,
                },
                () => lastValueFrom(next.handle())
            )
        );
    }
}
