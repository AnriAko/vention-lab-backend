import { Prisma } from '~/generated/prisma/client';

export const fileSelect = {
    id: true,
    ownerId: true,
    organizationId: true,
    name: true,
    size: true,
    status: true,
    contentType: true,
    storageKey: true,
    processingError: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.FileSelect;

export type FileSafe = Prisma.FileGetPayload<{
    select: typeof fileSelect;
}>;
