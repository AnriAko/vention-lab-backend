export const AI_DOCUMENT_EXCHANGE = 'rag';

export const AI_DOCUMENT_PROCESS_ROUTING_KEY = 'rag.process';
export const AI_DOCUMENT_PROCESS_QUEUE = 'rag.process.queue';
export const AI_DOCUMENT_PROCESS_DLX = 'rag.process.dlx';
export const AI_DOCUMENT_PROCESS_DLQ = 'rag.process.dlq';
export const AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY = 'rag.process.dead';

export const AI_DOCUMENT_DELETE_ROUTING_KEY = 'rag.delete';
export const AI_DOCUMENT_DELETE_QUEUE = 'rag.delete.queue';
export const AI_DOCUMENT_DELETE_DLX = 'rag.delete.dlx';
export const AI_DOCUMENT_DELETE_DLQ = 'rag.delete.dlq';
export const AI_DOCUMENT_DELETE_DLQ_ROUTING_KEY = 'rag.delete.dead';

export const AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE = 'rag.process.results';
export const AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY = 'rag.process.result';
export const AI_DOCUMENT_PROCESS_RESULTS_QUEUE = 'rag.process.results.queue';

export const AI_DOCUMENT_PROCESS_MAX_RETRIES = 3;
export const AI_DOCUMENT_PROCESS_RETRY_HEADER = 'x-rag-retry-count';

export const AI_DOCUMENT_DELETE_MAX_RETRIES = 3;
export const AI_DOCUMENT_DELETE_RETRY_HEADER = 'x-rag-delete-retry-count';

export enum AiDocumentProcessStatus {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export function isAiDocumentProcessStatus(
    value: unknown
): value is AiDocumentProcessStatus {
    return (
        value === AiDocumentProcessStatus.PROCESSING ||
        value === AiDocumentProcessStatus.COMPLETED ||
        value === AiDocumentProcessStatus.FAILED
    );
}

export const AiDocumentExtensions = {
    MD: ['md'],
    PDF: ['pdf'],
};
