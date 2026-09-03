export const RAG_EXCHANGE = 'rag';

export const RAG_PROCESS_ROUTING_KEY = 'rag.process';
export const RAG_PROCESS_QUEUE = 'rag.process.queue';
export const RAG_PROCESS_DLX = 'rag.process.dlx';
export const RAG_PROCESS_DLQ = 'rag.process.dlq';
export const RAG_PROCESS_DLQ_ROUTING_KEY = 'rag.process.dead';

export const RAG_DELETE_ROUTING_KEY = 'rag.delete';
export const RAG_DELETE_QUEUE = 'rag.delete.queue';
export const RAG_DELETE_DLX = 'rag.delete.dlx';
export const RAG_DELETE_DLQ = 'rag.delete.dlq';
export const RAG_DELETE_DLQ_ROUTING_KEY = 'rag.delete.dead';

export const RAG_PROCESS_RESULTS_EXCHANGE = 'rag.process.results';
export const RAG_PROCESS_RESULTS_ROUTING_KEY = 'rag.process.result';
export const RAG_PROCESS_RESULTS_QUEUE = 'rag.process.results.queue';

export const RAG_PROCESS_MAX_RETRIES = 3;
export const RAG_PROCESS_RETRY_HEADER = 'x-rag-retry-count';

export const RAG_DELETE_MAX_RETRIES = 3;
export const RAG_DELETE_RETRY_HEADER = 'x-rag-delete-retry-count';

export enum RagProcessStatus {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export function isRagProcessStatus(value: unknown): value is RagProcessStatus {
    return (
        value === RagProcessStatus.PROCESSING ||
        value === RagProcessStatus.COMPLETED ||
        value === RagProcessStatus.FAILED
    );
}

export const RagFileExtensions = {
    MD: ['md'],
};
