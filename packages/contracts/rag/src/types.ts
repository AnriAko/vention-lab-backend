import type { AiDocumentProcessStatus } from './constants';

export type AiDocumentProcessJobMessage = {
    fileId: string;
    storageKey: string;
    originalFilename: string;
    contentType: string;
    size: number;
    organizationId: string;
    ownerId: string;
    publishedAt: string;
};

export type AiDocumentProcessResultPayload = {
    status: AiDocumentProcessStatus;
    success: boolean;
    error: string | null;
};

export type AiDocumentProcessResultMessage = AiDocumentProcessResultPayload & {
    fileId: string;
    organizationId: string;
    ownerId: string;
};

export type AiDocumentDeleteJobMessage = {
    fileId: string;
};
