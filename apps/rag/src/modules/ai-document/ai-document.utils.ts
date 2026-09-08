import { promisify } from 'node:util';
import { gunzip as zlibGunzip } from 'node:zlib';

import { PermanentAiDocumentError } from './ai-document.errors';

const gunzip = promisify(zlibGunzip);

export function getFileExtension(storageKey: string): string {
    const withoutGzip = storageKey.endsWith('.gz')
        ? storageKey.slice(0, -3)
        : storageKey;

    const extension = withoutGzip.split('.').pop()?.toLowerCase();

    if (!extension) {
        throw new PermanentAiDocumentError('File extension is missing');
    }

    return extension;
}

export async function decompressIfNeeded(
    buffer: Buffer,
    storageKey: string
): Promise<Buffer> {
    if (!storageKey.endsWith('.gz')) {
        return buffer;
    }

    return gunzip(buffer);
}
