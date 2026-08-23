export const FILE_PROCESSING_EXCHANGE = 'file.processing';
export const FILE_PROCESSING_ROUTING_KEY = 'file.process';
export const FILE_PROCESSING_QUEUE = 'file.processing.queue';

export const FILE_PROCESSING_DLX = 'file.processing.dlx';
export const FILE_PROCESSING_DLQ = 'file.processing.dlq';
export const FILE_PROCESSING_DLQ_ROUTING_KEY = 'file.process.dead';

export const FILE_PROCESSING_RESULTS_EXCHANGE = 'file.processing.results';
export const FILE_PROCESSING_RESULTS_ROUTING_KEY = 'file.result';
export const FILE_PROCESSING_RESULTS_QUEUE = 'file.processing.results.queue';

export const FILE_PROCESSING_MAX_RETRIES = 3;
export const FILE_PROCESSING_RETRY_HEADER = 'x-retry-count';

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
