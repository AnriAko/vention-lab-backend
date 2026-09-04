export class PermanentRagError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermanentRagError';
    }
}

export class TransientRagError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransientRagError';
    }
}
