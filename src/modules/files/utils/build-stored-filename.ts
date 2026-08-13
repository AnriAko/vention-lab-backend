import { randomUUID } from 'node:crypto';

import { COMPRESSED_STORAGE_SUFFIX } from '~/modules/files/files.constants';

export const buildStoredFileName = (extension: string): string => {
    const safeExtension = extension.startsWith('.')
        ? extension.toLowerCase()
        : `.${extension.toLowerCase()}`;

    return `${randomUUID()}${safeExtension}${COMPRESSED_STORAGE_SUFFIX}`;
};
