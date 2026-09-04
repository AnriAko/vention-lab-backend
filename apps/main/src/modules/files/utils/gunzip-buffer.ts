import { promisify } from 'node:util';
import { gunzip as zlibGunzip } from 'node:zlib';

import { AppException } from '~/common/errors/app-exception';
import { FILE_MAX_SIZE_BYTES } from '~/modules/files/files.constants';
import { FileErrors } from '~/modules/files/files.errors';

const gunzip = promisify(zlibGunzip);

export async function gunzipBuffer(buffer: Buffer): Promise<Buffer> {
    try {
        return await gunzip(buffer, {
            maxOutputLength: FILE_MAX_SIZE_BYTES,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message.includes('maxOutputLength') ||
                error.message.includes('unexpected end of file') ||
                error.message.includes('incorrect header check'))
        ) {
            throw new AppException(FileErrors.INVALID_ENCODING, {
                message: 'Failed to decompress gzip payload',
                details: {
                    reason: error.message,
                },
            });
        }

        throw new AppException(FileErrors.INVALID_ENCODING, {
            message: 'Failed to decompress gzip payload',
        });
    }
}
