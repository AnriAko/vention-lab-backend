import { Injectable } from '@nestjs/common';
import type { Prisma } from '~/generated/prisma/client';

import { PrismaService } from '~/infrastructure/database/prisma.service';
import { getPrismaTransaction } from '~/infrastructure/database/transactions/transaction-context';

import { AUTH_GUEST } from '~/common/security/auth.types';
import type { AppRole } from '~/common/security/permissions/app-role.enum';
import { requestContext } from '~/common/tenancy/request-context/request-context';

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
