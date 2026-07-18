import { AsyncLocalStorage } from 'node:async_hooks';
import type { AppRole } from '~/common/types/app-role.enum';
import { AUTH_GUEST } from '~/common/types/auth.types';
import type { Prisma } from '~/generated/prisma/client';

export type RequestContext = {
    requestId: string;
    startTime: number;
    userId: string;
    organizationId?: string;
    role?: AppRole;
    transaction?: Prisma.TransactionClient;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function setRequestUser(userId: string) {
    const store = requestContext.getStore();

    if (!store) return;

    store.userId = userId ?? AUTH_GUEST;
}

export function setRequestOrganization(organizationId: string) {
    const store = requestContext.getStore();

    if (!store) return;

    store.organizationId = organizationId;
}

export function setRequestRole(role: AppRole) {
    const store = requestContext.getStore();

    if (!store) return;

    store.role = role;
}

export function getPrismaTransaction(): Prisma.TransactionClient | undefined {
    return requestContext.getStore()?.transaction;
}

export function runWithPrismaTransaction<T>(
    transaction: Prisma.TransactionClient,
    callback: () => T
): T {
    const parent = requestContext.getStore();

    if (!parent) {
        throw new Error('RLS: Missing request context');
    }

    if (parent.transaction === transaction) {
        return callback();
    }

    if (parent.transaction) {
        throw new Error(
            'RLS: Active transaction already exists; nested BEGIN is not allowed'
        );
    }

    return requestContext.run(
        {
            ...parent,
            transaction,
        },
        callback
    );
}
