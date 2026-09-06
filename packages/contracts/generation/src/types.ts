import type { GenerationStatus } from './constants';

export type GenerationMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export type GenerationHistoryMessage = {
    role: GenerationMessageRole;
    content: string;
};

export type GenerationRequestMessage = {
    requestId: string;
    organizationId: string;
    ownerId: string;
    conversationId: string;
    prompt: string;
    messages: GenerationHistoryMessage[];
    publishedAt: string;
};

export type GenerationCancelMessage = {
    requestId: string;
    organizationId: string;
    ownerId: string;
    conversationId: string;
    publishedAt: string;
};

export type GenerationResultMessage = {
    requestId: string;
    organizationId: string;
    ownerId: string;
    conversationId: string;
    status: GenerationStatus;
    success: boolean;
    error: string | null;
    content: string | null;
};

export type GenerationEventType =
    'CHUNK' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export type GenerationEventMessage = {
    requestId: string;
    organizationId: string;
    ownerId: string;
    conversationId: string;
    event: GenerationEventType;
    payload: Record<string, unknown>;
};
