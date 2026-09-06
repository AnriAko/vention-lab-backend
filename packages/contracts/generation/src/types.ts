export type GenerationMessageRole = 'system' | 'user' | 'assistant';

export type GenerationMessage = {
    role: GenerationMessageRole;
    content: string;
};

export type GenerationOptions = {
    temperature?: number;
    maxTokens?: number;
};

export type GenerationStartPayload = {
    generationId: string;
    conversationId: string;
    query: string;
    organizationId: string;
    history: GenerationMessage[];
    options?: GenerationOptions;
};

export type GenerationCancelPayload = {
    generationId: string;
};

export type GenerationChunkPayload = {
    generationId: string;
    chunk: string;
};

export type GenerationDonePayload = {
    generationId: string;
};

export type GenerationErrorPayload = {
    generationId: string;
    error: string;
};

export type GenerationCancelledPayload = {
    generationId: string;
};
