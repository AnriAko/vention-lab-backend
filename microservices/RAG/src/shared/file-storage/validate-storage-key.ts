import path from 'node:path';

import { InvalidStorageKeyError } from './file-storage.error';

export function validateStorageKey(storageKey: string): void {
    if (
        !storageKey ||
        path.isAbsolute(storageKey) ||
        storageKey.includes('..') ||
        storageKey.includes('\\')
    ) {
        throw new InvalidStorageKeyError(storageKey);
    }
}
