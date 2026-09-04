import path from 'node:path';

import { AppException } from '~/common/errors/app-exception';
import {
    ALLOWED_EXTENSIONS,
    ALLOWED_FILE_TYPES,
    FILE_MAX_SIZE_BYTES,
    type AllowedMimeType,
} from '../files.constants';
import { FileErrors } from '../files.errors';
import type { MulterUploadedFile } from '../types/uploaded-file.type';

export type ValidatedUpload = {
    buffer: Buffer;
    originalName: string;
    extension: string;
    mimeType: AllowedMimeType;
    size: number;
};

function normalizeExtension(originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();

    if (!extension || extension === '.') {
        return '';
    }

    return extension;
}

function sanitizeOriginalName(originalName: string): string {
    const baseName = path.basename(originalName).trim();

    if (!baseName || baseName === '.' || baseName === '..') {
        return 'unnamed';
    }

    return baseName;
}

export function validateUploadedFile(
    file: MulterUploadedFile | undefined
): ValidatedUpload {
    if (!file) {
        throw new AppException(FileErrors.REQUIRED);
    }

    const buffer = file.buffer;

    if (!buffer || buffer.length === 0 || file.size === 0) {
        throw new AppException(FileErrors.EMPTY);
    }

    if (
        file.size > FILE_MAX_SIZE_BYTES ||
        buffer.length > FILE_MAX_SIZE_BYTES
    ) {
        throw new AppException(FileErrors.TOO_LARGE, {
            details: {
                maxSizeBytes: FILE_MAX_SIZE_BYTES,
                receivedSizeBytes: file.size,
            },
        });
    }

    const mimeType = file.mimetype?.toLowerCase() as
        AllowedMimeType | undefined;
    const originalName = sanitizeOriginalName(file.originalname ?? '');
    const extension = normalizeExtension(originalName);

    if (!mimeType || !(mimeType in ALLOWED_FILE_TYPES)) {
        throw new AppException(FileErrors.INVALID_TYPE, {
            details: {
                mimeType: file.mimetype,
                allowedMimeTypes: Object.keys(ALLOWED_FILE_TYPES),
            },
        });
    }

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        throw new AppException(FileErrors.INVALID_EXTENSION, {
            details: {
                extension: extension || null,
                allowedExtensions: ALLOWED_EXTENSIONS,
            },
        });
    }

    const allowedExtensionsForMime = ALLOWED_FILE_TYPES[mimeType];

    if (!(allowedExtensionsForMime as readonly string[]).includes(extension)) {
        throw new AppException(FileErrors.TYPE_MISMATCH, {
            details: {
                mimeType,
                extension,
                expectedExtensions: allowedExtensionsForMime,
            },
        });
    }

    return {
        buffer,
        originalName,
        extension,
        mimeType,
        size: buffer.length,
    };
}
