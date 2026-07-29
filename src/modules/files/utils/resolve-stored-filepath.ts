import path from 'node:path';
import { AppException } from '~/common/errors/app-exception';
import { FILES_STORAGE_DIR } from '~/modules/files/files.constants';
import { FileErrors } from '~/modules/files/files.errors';

export const resolveStoredFilePath = (storageKey: string): string => {
    const resolvedStorageDir = path.resolve(FILES_STORAGE_DIR);
    const resolvedPath = path.resolve(resolvedStorageDir, storageKey);

    if (
        resolvedPath !== resolvedStorageDir &&
        !resolvedPath.startsWith(`${resolvedStorageDir}${path.sep}`)
    ) {
        throw new AppException(FileErrors.STORAGE_ERROR, {
            message: 'Invalid storage key',
        });
    }

    return resolvedPath;
};
