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

export type FileProcessResultStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type FileProcessUserTotal = {
    userEmail: string;
    amount: string;
};

export type FileProcessResultMessage = {
    fileId: string;
    organizationId: string;
    ownerId: string;
    status: FileProcessResultStatus;
    success: boolean;
    error: string | null;
    totals: FileProcessUserTotal[] | null;
};
