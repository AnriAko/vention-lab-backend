import { Injectable } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import { AppException } from '~/common/errors/app-exception';
import { FILES_STORAGE_DIR } from './files.constants';
import { FileErrors } from './files.errors';
import { resolveStoredFilePath } from '~/modules/files/utils/resolve-stored-filepath';

@Injectable()
export class FileStorageService {
    ensureFilesStorageDir() {
        return mkdir(FILES_STORAGE_DIR, { recursive: true });
    }

    async writeFile(storageKey: string, buffer: Buffer): Promise<string> {
        await this.ensureFilesStorageDir();

        const absolutePath = resolveStoredFilePath(storageKey);

        try {
            await pipeline(
                Readable.from(buffer),
                createWriteStream(absolutePath)
            );
        } catch {
            await unlink(absolutePath).catch(() => undefined);
            throw new AppException(FileErrors.STORAGE_ERROR);
        }

        return absolutePath;
    }

    async assertExists(storageKey: string): Promise<string> {
        const absolutePath = resolveStoredFilePath(storageKey);

        try {
            await access(absolutePath);
        } catch {
            throw new AppException(FileErrors.NOT_FOUND);
        }

        return absolutePath;
    }

    openReadStream(storageKey: string) {
        const absolutePath = resolveStoredFilePath(storageKey);
        return createReadStream(absolutePath);
    }

    remove(storageKey: string): Promise<void> {
        const absolutePath = resolveStoredFilePath(storageKey);

        return unlink(absolutePath).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        });
    }

    buildContentDisposition(filename: string): string {
        const sanitized = filename.replace(/["\\\r\n]/g, '_');
        const encoded = encodeURIComponent(filename);

        return `attachment; filename="${sanitized}"; filename*=UTF-8''${encoded}`;
    }
}
