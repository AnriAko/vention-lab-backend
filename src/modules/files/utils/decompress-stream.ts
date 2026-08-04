import { createGunzip } from 'node:zlib';
import type { Readable } from 'node:stream';

import { AppException } from '~/common/errors/app-exception';
import { COMPRESSED_STORAGE_SUFFIX } from '~/modules/files/files.constants';
import { FileErrors } from '~/modules/files/files.errors';

export function isCompressedStorageKey(storageKey: string): boolean {
    return storageKey.endsWith(COMPRESSED_STORAGE_SUFFIX);
}

export function createGunzipStream(source: Readable): Readable {
    const gunzip = createGunzip();

    gunzip.on('error', () => {
        source.destroy();
    });

    source.on('error', (error) => {
        gunzip.destroy(error);
    });

    return source.pipe(gunzip);
}

export function openStoredReadStream(
    storageKey: string,
    openRawStream: (storageKey: string) => Readable
): Readable {
    const stream = openRawStream(storageKey);

    if (!isCompressedStorageKey(storageKey)) {
        return stream;
    }

    try {
        return createGunzipStream(stream);
    } catch {
        stream.destroy();
        throw new AppException(FileErrors.STORAGE_ERROR, {
            message: 'Failed to decompress file',
        });
    }
}
