import { Injectable } from '@nestjs/common';
import type { Prisma } from '~/generated/prisma/client';

import { PrismaService } from './prisma.service';
import {
    getPrismaTransaction,
    requestContext,
} from '~/infrastructure/context/request-context';
import { AUTH_GUEST } from '~/common/types/auth.types';
import type { AppRole } from '~/common/types/app-role.enum';

/**
 * Opens a single interactive transaction, sets PostgreSQL RLS session
 * variables, and exposes the transaction via an immutable nested
 * RequestContext ALS scope (requestContext.run).
 *
 * Lifecycle:
 * BEGIN → ALS { ...ctx, transaction } → set_config(app.current_*) → callback → COMMIT
 * On error: Prisma rolls back; ALS scope ends automatically (no manual cleanup)
 *
 * Nested withRls() / withTenant() calls reuse the current transaction and
 * current RLS identity — never BEGIN inside BEGIN.
 */
@Injectable()
export class PrismaRlsService {
    constructor(private readonly prisma: PrismaService) {}

    async withRls<T>(callback: () => Promise<T>): Promise<T> {
        const ctx = requestContext.getStore();

        if (!ctx?.userId || ctx.userId === AUTH_GUEST) {
            throw new Error('RLS: Missing user context');
        }

        if (!ctx.organizationId) {
            throw new Error('RLS: Missing organization context');
        }

        if (!ctx.role) {
            throw new Error('RLS: Missing role context');
        }

        // Nested RLS scopes reuse current transaction and current RLS identity
        if (ctx.transaction) {
            return callback();
        }

        const identity = {
            requestId: ctx.requestId,
            startTime: ctx.startTime,
            userId: ctx.userId,
            organizationId: ctx.organizationId,
            role: ctx.role,
        };

        return this.prisma.$transaction(async (transaction) => {
            return requestContext.run(
                {
                    ...identity,
                    transaction,
                },
                async () => {
                    await transaction.$executeRaw`
                        SELECT set_config(
                            'app.current_user',
                            ${identity.userId},
                            true
                        )
                    `;

                    await transaction.$executeRaw`
                        SELECT set_config(
                            'app.current_organization',
                            ${identity.organizationId},
                            true
                        )
                    `;

                    await transaction.$executeRaw`
                        SELECT set_config(
                            'app.current_role',
                            ${identity.role},
                            true
                        )
                    `;

                    return callback();
                }
            );
        });
    }

    /**
     * Convenience entry when user/org are already known (e.g. scripts).
     * Prefer request-scoped withRls() for HTTP handlers.
     *
     * Nested RLS scopes reuse current transaction and current RLS identity.
     */
    async withTenant<T>(
        params: {
            userId: string;
            organizationId: string;
            role: AppRole;
        },
        callback: () => Promise<T>
    ): Promise<T> {
        const parent = requestContext.getStore();

        return requestContext.run(
            {
                requestId: parent?.requestId ?? 'rls',
                startTime: parent?.startTime ?? Date.now(),
                userId: params.userId,
                organizationId: params.organizationId,
                role: params.role,
                transaction: parent?.transaction,
            },
            () => this.withRls(callback)
        );
    }

    getTransaction(): Prisma.TransactionClient | undefined {
        return getPrismaTransaction();
    }
}
