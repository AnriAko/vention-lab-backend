export class InvalidStorageKeyError extends Error {
    constructor(storageKey: string) {
        super(`Invalid storage key: ${storageKey}`);
        this.name = 'InvalidStorageKeyError';
    }
}

export class StorageObjectNotFoundError extends Error {
    constructor(storageKey: string) {
        super(`Storage object not found: ${storageKey}`);
        this.name = 'StorageObjectNotFoundError';
    }
}

export class StorageWriteError extends Error {
    constructor(storageKey: string) {
        super(`Failed to write storage object: ${storageKey}`);
        this.name = 'StorageWriteError';
    }
}
