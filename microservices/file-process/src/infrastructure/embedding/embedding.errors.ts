export class EmbeddingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EmbeddingError';
    }
}

export class EmbeddingProviderUnavailableError extends EmbeddingError {
    constructor(message = 'Embedding provider is unavailable') {
        super(message);
        this.name = 'EmbeddingProviderUnavailableError';
    }
}

export class EmbeddingModelNotFoundError extends EmbeddingError {
    constructor(model: string) {
        super(`Embedding model not found: ${model}`);
        this.name = 'EmbeddingModelNotFoundError';
    }
}

export class InvalidEmbeddingResponseError extends EmbeddingError {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidEmbeddingResponseError';
    }
}

export class InvalidEmbeddingDimensionError extends EmbeddingError {
    constructor(expected: number, actual: number) {
        super(
            `Invalid embedding dimension: expected ${expected}, got ${actual}`
        );
        this.name = 'InvalidEmbeddingDimensionError';
    }
}
