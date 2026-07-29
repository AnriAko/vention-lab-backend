import path from 'node:path';

import { AppException } from '~/common/errors/app-exception';
import { FileErrors } from '~/modules/files/files.errors';

export const validateStorageKey = (storageKey: string): void => {
    if (
        !storageKey ||
        path.isAbsolute(storageKey) ||
        storageKey.includes('..') ||
        storageKey.includes('\\')
    ) {
        throw new AppException(FileErrors.STORAGE_ERROR, {
            message: 'Invalid storage key',
        });
    }
};
