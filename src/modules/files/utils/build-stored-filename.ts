import { randomUUID } from 'node:crypto';

import { COMPRESSED_STORAGE_SUFFIX } from '~/modules/files/files.constants';

export const buildStoredFileName = (
    extension: string,
    compressed = true
): string => {
    const safeExtension = extension.startsWith('.')
        ? extension.toLowerCase()
        : `.${extension.toLowerCase()}`;

    const baseName = `${randomUUID()}${safeExtension}`;

    return compressed
        ? `${baseName}${COMPRESSED_STORAGE_SUFFIX}`
        : baseName;
};
