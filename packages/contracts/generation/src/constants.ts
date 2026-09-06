export const GENERATION_WS_NAMESPACE = '/ai';

export const GENERATION_WS_START_EVENT = 'generation:start';

export const GENERATION_WS_CANCEL_EVENT = 'generation:cancel';

export const GENERATION_WS_CHUNK_EVENT = 'generation:chunk';

export const GENERATION_WS_DONE_EVENT = 'generation:done';

export const GENERATION_WS_ERROR_EVENT = 'generation:error';

export const GENERATION_WS_CANCELLED_EVENT = 'generation:cancelled';

export const GENERATION_WS_ORG_ROOM_PREFIX = 'org:';

export enum GenerationStatus {
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

export function isGenerationStatus(value: unknown): value is GenerationStatus {
    return (
        value === GenerationStatus.PROCESSING ||
        value === GenerationStatus.COMPLETED ||
        value === GenerationStatus.FAILED ||
        value === GenerationStatus.CANCELLED
    );
}
