export class PermanentProcessingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermanentProcessingError';
    }
}

export class TransientProcessingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransientProcessingError';
    }
}
