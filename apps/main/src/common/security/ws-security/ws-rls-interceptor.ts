import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { from, lastValueFrom, type Observable } from 'rxjs';

import type { AuthUser } from '~/common/security/auth.types';
import { getWsClient } from '~/common/security/utils/execution-context';
import { getWsClientUser } from '~/common/security/utils/ws-handshake';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { PrismaRlsService } from '~/common/tenancy/rls/prisma-rls.service';

/**
 * Runs tenant RLS for WebSocket handlers.
 *
 * Global APP_INTERCEPTOR does not wrap @SubscribeMessage handlers,
 * so chat gateway DB handlers opt in explicitly.
 */
@Injectable()
export class WsRlsContext {
    constructor(private readonly prismaRlsService: PrismaRlsService) {}

    runAuthenticated<T>(
        user: AuthUser,
        callback: () => Promise<T>
    ): Promise<T> {
        const parent = requestContext.getStore();

        if (parent?.transaction) {
            return callback();
        }

        return requestContext.run(
            {
                requestId: parent?.requestId ?? randomUUID(),
                startTime: parent?.startTime ?? Date.now(),
                userId: user.userId,
                organizationId: user.organizationId,
                role: user.role,
            },
            () => this.prismaRlsService.withRls(callback)
        );
    }
}

@Injectable()
export class WsRlsInterceptor implements NestInterceptor {
    constructor(private readonly wsRlsContext: WsRlsContext) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        const client = getWsClient(context);
        const user = getWsClientUser(client);

        if (!user?.userId || !user.organizationId || !user.role) {
            throw new Error(
                'Authenticated user is missing from WebSocket client'
            );
        }

        return from(
            this.wsRlsContext.runAuthenticated(user, () =>
                lastValueFrom(next.handle())
            )
        );
    }
}
