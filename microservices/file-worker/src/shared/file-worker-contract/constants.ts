export const FILE_WORKER_EXCHANGE = 'file.worker';

export const FILE_WORKER_PROCESSING_ROUTING_KEY = 'file.worker.process';
export const FILE_WORKER_PROCESSING_QUEUE = 'file.worker.process.queue';
export const FILE_WORKER_PROCESSING_DLX = 'file.worker.process.dlx';
export const FILE_WORKER_PROCESSING_DLQ = 'file.worker.process.dlq';
export const FILE_WORKER_PROCESSING_DLQ_ROUTING_KEY =
    'file.worker.process.dead';

export const FILE_WORKER_DELETE_ROUTING_KEY = 'file.worker.delete';
export const FILE_WORKER_DELETE_QUEUE = 'file.worker.delete.queue';
export const FILE_WORKER_DELETE_DLX = 'file.worker.delete.dlx';
export const FILE_WORKER_DELETE_DLQ = 'file.worker.delete.dlq';
export const FILE_WORKER_DELETE_DLQ_ROUTING_KEY = 'file.worker.delete.dead';

export const FILE_WORKER_PROCESSING_RESULTS_EXCHANGE =
    'file.processing.results';

export const FILE_WORKER_PROCESSING_RESULTS_ROUTING_KEY = 'file.result';

export const FILE_WORKER_PROCESSING_RESULTS_QUEUE =
    'file.processing.results.queue';

export const FILE_WORKER_PROCESSING_MAX_RETRIES = 3;
export const FILE_WORKER_PROCESSING_RETRY_HEADER = 'x-retry-count';

export const FILE_WORKER_DELETE_MAX_RETRIES = 3;
export const FILE_WORKER_DELETE_RETRY_HEADER = 'x-delete-retry-count';

export const FILE_STATUS_WS_EVENT = 'file.status';
export const FILE_STATUS_WS_NAMESPACE = '/files';
export const FILE_STATUS_WS_SUBSCRIBE_EVENT = 'subscribe';
export const FILE_STATUS_WS_ORG_ROOM_PREFIX = 'org:';

export const FILE_PROCESSING_GZIP_SUFFIX = '.gz';

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

export enum FileType {
    EXCEL = 'excel',
    MD = 'md',
    // PDF = 'pdf',
    // TXT = 'txt',
}

export const FileExtensions = {
    EXCEL: ['xlsx', 'xls', 'xlsm'],
    MD: ['md'],
};
