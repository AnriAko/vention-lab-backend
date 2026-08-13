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

export enum FileProcessStatus {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export function isFileProcessStatus(
    value: unknown
): value is FileProcessStatus {
    return (
        value === FileProcessStatus.PROCESSING ||
        value === FileProcessStatus.COMPLETED ||
        value === FileProcessStatus.FAILED
    );
}

export type FileProcessUserTotal = {
    userEmail: string;
    amount: string;
};

export type FileProcessResultMessage = {
    fileId: string;
    organizationId: string;
    ownerId: string;
    status: FileProcessStatus;
    success: boolean;
    error: string | null;
    totals: FileProcessUserTotal[] | null;
};
