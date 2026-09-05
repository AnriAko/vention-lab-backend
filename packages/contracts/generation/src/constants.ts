export const GENERATION_EXCHANGE = 'generation';

export const GENERATION_REQUEST_ROUTING_KEY = 'generation.request';
export const GENERATION_REQUEST_QUEUE = 'generation.request.queue';
export const GENERATION_REQUEST_DLX = 'generation.request.dlx';
export const GENERATION_REQUEST_DLQ = 'generation.request.dlq';
export const GENERATION_REQUEST_DLQ_ROUTING_KEY = 'generation.request.dead';

export const GENERATION_RESULTS_EXCHANGE = 'generation.results';
export const GENERATION_RESULT_ROUTING_KEY = 'generation.result';
export const GENERATION_RESULTS_QUEUE = 'generation.results.queue';

export const GENERATION_EVENTS_EXCHANGE = 'generation.events';
export const GENERATION_EVENT_ROUTING_KEY = 'generation.event';
export const GENERATION_EVENTS_QUEUE = 'generation.events.queue';

export const GENERATION_REQUEST_MAX_RETRIES = 3;
export const GENERATION_REQUEST_RETRY_HEADER = 'x-generation-retry-count';

export const GENERATION_WS_NAMESPACE = '/ai';
export const GENERATION_WS_EVENT = 'generation.event';
export const GENERATION_WS_SUBSCRIBE_EVENT = 'subscribe';
export const GENERATION_WS_ORG_ROOM_PREFIX = 'org:';

export enum GenerationStatus {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export function isGenerationStatus(value: unknown): value is GenerationStatus {
    return (
        value === GenerationStatus.PROCESSING ||
        value === GenerationStatus.COMPLETED ||
        value === GenerationStatus.FAILED
    );
}
