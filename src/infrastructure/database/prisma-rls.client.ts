import { Injectable } from '@nestjs/common';
import type { Prisma } from '~/generated/prisma/client';

import { getPrismaTransaction } from '~/infrastructure/context/request-context';

/**
 * Transparent Prisma client for only tenant-scoped repositories.
 *
 * Always uses the active interactive transaction from RequestContext.
 * Never falls back to PrismaService — that would bypass RLS session vars.
 *
 * Repositories must not accept TransactionClient parameters.
 */
@Injectable()
export class PrismaRlsClient {
    private get client(): Prisma.TransactionClient {
        const transaction = getPrismaTransaction();

        if (!transaction) {
            throw new Error(
                'RLS: No active tenant transaction. Tenant queries must run inside PrismaRlsService.withRls().'
            );
        }

        return transaction;
    }

    get user() {
        return this.client.user;
    }

    get owner() {
        return this.client.owner;
    }

    get organization() {
        return this.client.organization;
    }

    get usersOrganizations() {
        return this.client.usersOrganizations;
    }

    get usersOrganizationsRoles() {
        return this.client.usersOrganizationsRoles;
    }

    get file() {
        return this.client.file;
    }

    get chat() {
        return this.client.chat;
    }

    get usersChats() {
        return this.client.usersChats;
    }

    get message() {
        return this.client.message;
    }

    $queryRaw<T = unknown>(
        ...args: Parameters<Prisma.TransactionClient['$queryRaw']>
    ): Prisma.PrismaPromise<T> {
        return this.client.$queryRaw<T>(...args);
    }

    $executeRaw(
        ...args: Parameters<Prisma.TransactionClient['$executeRaw']>
    ): Prisma.PrismaPromise<number> {
        return this.client.$executeRaw(...args);
    }

    $queryRawUnsafe<T = unknown>(
        ...args: Parameters<Prisma.TransactionClient['$queryRawUnsafe']>
    ): Prisma.PrismaPromise<T> {
        return this.client.$queryRawUnsafe<T>(...args);
    }

    $executeRawUnsafe(
        ...args: Parameters<Prisma.TransactionClient['$executeRawUnsafe']>
    ): Prisma.PrismaPromise<number> {
        return this.client.$executeRawUnsafe(...args);
    }
}
