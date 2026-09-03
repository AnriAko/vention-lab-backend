import type { RagProcessStatus } from './constants';

export type RagProcessJobMessage = {
    fileId: string;
    storageKey: string;
    originalFilename: string;
    contentType: string;
    size: number;
    organizationId: string;
    ownerId: string;
    publishedAt: string;
};

export type RagProcessResultPayload = {
    status: RagProcessStatus;
    success: boolean;
    error: string | null;
};

export type RagProcessResultMessage = RagProcessResultPayload & {
    fileId: string;
    organizationId: string;
    ownerId: string;
};

export type RagDeleteJobMessage = {
    fileId: string;
};
