import type { FileProcessStatus } from './constants';

export type FileProcessJobMessage = {
    fileId: string;
    storageKey: string;
    originalFilename: string;
    contentType: string;
    size: number;
    organizationId: string;
    ownerId: string;
    publishedAt: string;
};

export type FileProcessUserTotal = {
    userEmail: string;
    amount: string;
};

export type FileProcessResultPayload = {
    status: FileProcessStatus;
    success: boolean;
    error: string | null;
    totals: FileProcessUserTotal[] | null;
};

export type FileProcessResultMessage = FileProcessResultPayload & {
    fileId: string;
    organizationId: string;
    ownerId: string;
};
