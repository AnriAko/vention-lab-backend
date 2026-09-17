export class PermanentAiDocumentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermanentAiDocumentError';
    }
}

export class TransientAiDocumentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransientAiDocumentError';
    }
}

export class PermanentDeleteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermanentDeleteError';
    }
}

export class TransientDeleteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransientDeleteError';
    }
}
