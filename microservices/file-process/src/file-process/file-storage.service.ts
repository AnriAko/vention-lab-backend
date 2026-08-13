import path from 'node:path';

import type { Bucket } from '@google-cloud/storage';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class InvalidStorageKeyError extends Error {
    constructor(storageKey: string) {
        super(`Invalid storage key: ${storageKey}`);
        this.name = 'InvalidStorageKeyError';
    }
}

export class StorageObjectNotFoundError extends Error {
    constructor(storageKey: string) {
        super(`Storage object not found: ${storageKey}`);
        this.name = 'StorageObjectNotFoundError';
    }
}

@Injectable()
export class FileStorageService {
    private readonly bucket: Bucket;

    constructor(private readonly config: ConfigService) {
        const projectId = this.config.getOrThrow<string>('FIREBASE_PROJECT_ID');
        const storageBucket = this.config.getOrThrow<string>(
            'FIREBASE_STORAGE_BUCKET'
        );
        const serviceAccountPath = path.resolve(
            process.cwd(),
            this.config.getOrThrow<string>('FIREBASE_SERVICE_ACCOUNT_PATH')
        );

        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccountPath),
                projectId,
                storageBucket,
            });
        } else {
            getApp();
        }

        this.bucket = getStorage().bucket(storageBucket);
    }

    async getFileBuffer(storageKey: string): Promise<Buffer> {
        if (
            !storageKey ||
            path.isAbsolute(storageKey) ||
            storageKey.includes('..') ||
            storageKey.includes('\\')
        ) {
            throw new InvalidStorageKeyError(storageKey);
        }

        const file = this.bucket.file(storageKey);
        const [exists] = await file.exists();

        if (!exists) {
            throw new StorageObjectNotFoundError(storageKey);
        }

        const [buffer] = await file.download();
        return buffer;
    }
}
