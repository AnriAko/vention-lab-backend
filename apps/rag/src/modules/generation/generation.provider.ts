export type GenerationMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
};

export type GenerationOptions = {
    temperature?: number;
};

export type GenerationRequest = {
    generationId: string;
    messages: GenerationMessage[];
    options?: GenerationOptions;
};

export type GenerationProvider = {
    generate(request: GenerationRequest): AsyncIterable<string>;
    cancel(generationId: string): void;
};

export const GENERATION_PROVIDER = Symbol('GENERATION_PROVIDER');
