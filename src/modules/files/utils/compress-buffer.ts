import { promisify } from 'node:util';
import { gzip as zlibGzip } from 'node:zlib';

import { AppException } from '~/common/errors/app-exception';
import { FileErrors } from '~/modules/files/files.errors';

const gzip = promisify(zlibGzip);

export async function gzipBuffer(buffer: Buffer): Promise<Buffer> {
    try {
        return await gzip(buffer);
    } catch {
        throw new AppException(FileErrors.STORAGE_ERROR, {
            message: 'Failed to compress file',
        });
    }
}
