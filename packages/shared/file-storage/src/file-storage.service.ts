import type { Bucket } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';

import { FirebaseService } from '@vention/shared-firebase';

import {
    StorageObjectNotFoundError,
    StorageWriteError,
} from './file-storage.error';
import { validateStorageKey } from './validate-storage-key';

@Injectable()
export class FileStorageService {
    private readonly bucket: Bucket;

    constructor(private readonly firebase: FirebaseService) {
        this.bucket = this.firebase.getBucket();
    }

    async writeFile(storageKey: string, buffer: Buffer): Promise<string> {
        validateStorageKey(storageKey);

        const file = this.bucket.file(storageKey);

        try {
            await file.save(buffer);
        } catch {
            await file.delete({ ignoreNotFound: true }).catch(() => undefined);
            throw new StorageWriteError(storageKey);
        }

        return storageKey;
    }

    async assertExists(storageKey: string): Promise<string> {
        validateStorageKey(storageKey);

        const file = this.bucket.file(storageKey);
        const [exists] = await file.exists();

        if (!exists) {
            throw new StorageObjectNotFoundError(storageKey);
        }

        return storageKey;
    }

    openReadStream(storageKey: string) {
        validateStorageKey(storageKey);

        return this.bucket.file(storageKey).createReadStream();
    }

    async remove(storageKey: string): Promise<void> {
        validateStorageKey(storageKey);

        await this.bucket.file(storageKey).delete({ ignoreNotFound: true });
    }

    async getFileBuffer(storageKey: string): Promise<Buffer> {
        validateStorageKey(storageKey);

        const file = this.bucket.file(storageKey);
        const [exists] = await file.exists();

        if (!exists) {
            throw new StorageObjectNotFoundError(storageKey);
        }

        const [buffer] = await file.download();

        return buffer;
    }
}
