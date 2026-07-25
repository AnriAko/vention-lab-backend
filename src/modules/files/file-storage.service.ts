import { Injectable } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';

import { AppException } from '~/common/errors/app-exception';
import { FILES_STORAGE_DIR } from './files.constants';
import { FileErrors } from './files.errors';

@Injectable()
export class FileStorageService {
    buildStoredFileName(extension: string): string {
        const safeExtension = extension.startsWith('.')
            ? extension.toLowerCase()
            : `.${extension.toLowerCase()}`;

        return `${randomUUID()}${safeExtension}`;
    }

    resolveStoredFilePath(storageKey: string): string {
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
    }

    async ensureFilesStorageDir(): Promise<void> {
        await mkdir(FILES_STORAGE_DIR, { recursive: true });
    }

    async writeFile(storageKey: string, buffer: Buffer): Promise<string> {
        await this.ensureFilesStorageDir();

        const absolutePath = this.resolveStoredFilePath(storageKey);

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
        const absolutePath = this.resolveStoredFilePath(storageKey);

        try {
            await access(absolutePath);
        } catch {
            throw new AppException(FileErrors.NOT_FOUND);
        }

        return absolutePath;
    }

    openReadStream(storageKey: string) {
        const absolutePath = this.resolveStoredFilePath(storageKey);
        return createReadStream(absolutePath);
    }

    async remove(storageKey: string): Promise<void> {
        const absolutePath = this.resolveStoredFilePath(storageKey);
        await unlink(absolutePath).catch(() => undefined);
    }

    buildContentDisposition(filename: string): string {
        const sanitized = filename.replace(/["\\\r\n]/g, '_');
        const encoded = encodeURIComponent(filename);

        return `attachment; filename="${sanitized}"; filename*=UTF-8''${encoded}`;
    }
}
