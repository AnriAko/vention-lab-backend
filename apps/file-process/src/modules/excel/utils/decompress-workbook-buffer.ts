import { gunzipSync } from 'node:zlib';

import { FILE_PROCESSING_GZIP_SUFFIX } from '~/shared/file-process-contract/constants';

export function decompressWorkbookBuffer(
    buffer: Buffer,
    storageKey: string
): Buffer {
    return storageKey.endsWith(FILE_PROCESSING_GZIP_SUFFIX)
        ? gunzipSync(buffer)
        : buffer;
}
