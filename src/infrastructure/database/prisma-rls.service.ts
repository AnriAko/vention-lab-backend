import { Injectable } from '@nestjs/common';
import { Prisma } from '~/generated/prisma/client';

import { PrismaService } from './prisma.service';
import { requestContext } from '~/infrastructure/context/request-context';

@Injectable()
export class PrismaRlsService {
    constructor(private readonly prisma: PrismaService) {}

    async transaction<T>(
        callback: (tx: Prisma.TransactionClient) => Promise<T>
    ): Promise<T> {
        const ctx = requestContext.getStore();

        if (!ctx?.userId) {
            throw new Error('RLS: Missing user context');
        }

        if (!ctx?.organizationId) {
            throw new Error('RLS: Missing organization context');
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.$executeRaw`
                    SELECT set_config(
                        'app.current_user',
                        ${ctx.userId},
                        true
                    )
                `;

            await tx.$executeRaw`
                    SELECT set_config(
                        'app.current_organization',
                        ${ctx.organizationId},
                        true
                    )
                `;

            return callback(tx);
        });
    }
}
