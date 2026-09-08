import type { FileStatus } from '~/generated/prisma/enums';

export type CreateFileData = {
    ownerId: string;
    organizationId: string;
    name: string;
    size: number;
    contentType: string;
    checksum: string;
    storageKey: string;
    status?: FileStatus;
};
