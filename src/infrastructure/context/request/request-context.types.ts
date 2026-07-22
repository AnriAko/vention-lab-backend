import type { Prisma } from '~/generated/prisma/client';
import type { AppRole } from '~/common/types/app-role.enum';

export type RequestContext = {
    requestId: string;
    startTime: number;

    userId: string;

    organizationId?: string;
    role?: AppRole;

    transaction?: Prisma.TransactionClient;
};
