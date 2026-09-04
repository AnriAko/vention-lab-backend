export class InvalidChunkingOptionsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidChunkingOptionsError';
    }
}
