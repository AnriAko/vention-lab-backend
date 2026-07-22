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
import { requestContext } from '~/infrastructure/context/request/request-context';
import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';

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
}
