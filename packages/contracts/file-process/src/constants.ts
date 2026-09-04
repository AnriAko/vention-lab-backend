export const FILE_PROCESS_EXCHANGE = 'file.process';

export const FILE_PROCESS_ROUTING_KEY = 'file.process';
export const FILE_PROCESS_QUEUE = 'file.process.queue';
export const FILE_PROCESS_DLX = 'file.process.dlx';
export const FILE_PROCESS_DLQ = 'file.process.dlq';
export const FILE_PROCESS_DLQ_ROUTING_KEY = 'file.process.dead';

export const FILE_PROCESS_RESULTS_EXCHANGE = 'file.process.results';
export const FILE_PROCESS_RESULTS_ROUTING_KEY = 'file.process.result';
export const FILE_PROCESS_RESULTS_QUEUE = 'file.process.results.queue';

export const FILE_PROCESS_MAX_RETRIES = 3;
export const FILE_PROCESS_RETRY_HEADER = 'x-retry-count';

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

export const FileExtensions = {
    EXCEL: ['xlsx', 'xls', 'xlsm'],
};
