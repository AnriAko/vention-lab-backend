import type { Prisma } from '~/generated/prisma/client';

import { requestContext } from '~/common/tenancy/request-context/request-context';

export const getPrismaTransaction = ():
    Prisma.TransactionClient | undefined => {
    return requestContext.getStore()?.transaction;
};

export const runWithPrismaTransaction = <T>(
    transaction: Prisma.TransactionClient,
    callback: () => T
): T => {
    const parent = requestContext.getStore();

    if (!parent) {
        throw new Error('RLS: Missing request context');
    }

    if (parent.transaction === transaction) {
        return callback();
    }

    if (parent.transaction) {
        throw new Error('RLS: Active transaction already exists');
    }

    return requestContext.run(
        {
            ...parent,
            transaction,
        },
        callback
    );
};
