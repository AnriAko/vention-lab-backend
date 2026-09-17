export const AI_DOCUMENT_EXCHANGE = 'ai.document';

export const AI_DOCUMENT_PROCESS_ROUTING_KEY = 'ai.document.process';
export const AI_DOCUMENT_PROCESS_QUEUE = 'ai.document.process.queue';
export const AI_DOCUMENT_PROCESS_DLX = 'ai.document.process.dlx';
export const AI_DOCUMENT_PROCESS_DLQ = 'ai.document.process.dlq';
export const AI_DOCUMENT_PROCESS_DLQ_ROUTING_KEY = 'ai.document.process.dead';

export const AI_DOCUMENT_DELETE_ROUTING_KEY = 'ai.document.delete';
export const AI_DOCUMENT_DELETE_QUEUE = 'ai.document.delete.queue';
export const AI_DOCUMENT_DELETE_DLX = 'ai.document.delete.dlx';
export const AI_DOCUMENT_DELETE_DLQ = 'ai.document.delete.dlq';
export const AI_DOCUMENT_DELETE_DLQ_ROUTING_KEY = 'ai.document.delete.dead';

export const AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE =
    'ai.document.process.results';
export const AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY =
    'ai.document.process.result';
export const AI_DOCUMENT_PROCESS_RESULTS_QUEUE =
    'ai.document.process.results.queue';

export const AI_DOCUMENT_PROCESS_MAX_RETRIES = 3;
export const AI_DOCUMENT_PROCESS_RETRY_HEADER = 'x-ai.document-retry-count';

export const AI_DOCUMENT_DELETE_MAX_RETRIES = 3;
export const AI_DOCUMENT_DELETE_RETRY_HEADER =
    'x-ai.document-delete-retry-count';

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
