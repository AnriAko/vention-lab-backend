import type { GenerationStatus } from './constants';

export type GenerationRequestMessage = {
    requestId: string;
    organizationId: string;
    ownerId: string;
    prompt: string;
    publishedAt: string;
};

export type GenerationResultMessage = {
    requestId: string;
    organizationId: string;
    ownerId: string;
    status: GenerationStatus;
    success: boolean;
    error: string | null;
    content: string | null;
};

export type GenerationEventMessage = {
    requestId: string;
    organizationId: string;
    ownerId: string;
    event: string;
    payload: Record<string, unknown>;
};
