import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Bucket } from '@google-cloud/storage';

import { AppException } from '~/common/errors/app-exception';
import { firebaseConfig } from '~/config/configuration/firebase.config';
import { FileErrors } from '~/modules/files/files.errors';

import {
    getFirebaseStorageBucket,
    initializeFirebaseAdmin,
} from './firebase-admin.app';
import { validateStorageKey } from './utils/validate-storage-key';

@Injectable()
export class FileStorageService {
    private readonly bucket: Bucket;

    constructor(
        @Inject(firebaseConfig.KEY)
        private readonly config: ConfigType<typeof firebaseConfig>
    ) {
        initializeFirebaseAdmin({
            projectId: this.config.projectId!,
            storageBucket: this.config.storageBucket!,
            serviceAccountPath: this.config.serviceAccountPath!,
        });

        this.bucket = getFirebaseStorageBucket(this.config.storageBucket);
    }

    async writeFile(storageKey: string, buffer: Buffer): Promise<string> {
        validateStorageKey(storageKey);

        const file = this.bucket.file(storageKey);

        try {
            await file.save(buffer);
        } catch {
            await file.delete({ ignoreNotFound: true }).catch(() => undefined);
            throw new AppException(FileErrors.STORAGE_ERROR);
        }

        return storageKey;
    }

    async assertExists(storageKey: string): Promise<string> {
        validateStorageKey(storageKey);

        const file = this.bucket.file(storageKey);
        const [exists] = await file.exists();

        if (!exists) {
            throw new AppException(FileErrors.NOT_FOUND);
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
}
