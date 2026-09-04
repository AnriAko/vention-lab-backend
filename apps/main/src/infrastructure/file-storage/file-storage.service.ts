import { Injectable } from '@nestjs/common';

import { AppException } from '~/common/errors/app-exception';
import { FileErrors } from '~/modules/files/files.errors';
import {
    FileStorageService as SharedFileStorageService,
    InvalidStorageKeyError,
    StorageObjectNotFoundError,
    StorageWriteError,
} from '~/shared/file-storage';

@Injectable()
export class FileStorageService {
    constructor(private readonly storage: SharedFileStorageService) {}

    writeFile(storageKey: string, buffer: Buffer): Promise<string> {
        return this.mapStorageErrors(
            () => this.storage.writeFile(storageKey, buffer),
            { invalidKey: FileErrors.STORAGE_ERROR }
        );
    }

    assertExists(storageKey: string): Promise<string> {
        return this.mapStorageErrors(
            () => this.storage.assertExists(storageKey),
            {
                invalidKey: FileErrors.STORAGE_ERROR,
                notFound: FileErrors.NOT_FOUND,
            }
        );
    }

    openReadStream(storageKey: string) {
        try {
            return this.storage.openReadStream(storageKey);
        } catch (error) {
            this.rethrowMapped(error, {
                invalidKey: FileErrors.STORAGE_ERROR,
            });
        }
    }

    remove(storageKey: string): Promise<void> {
        return this.mapStorageErrors(() => this.storage.remove(storageKey), {
            invalidKey: FileErrors.STORAGE_ERROR,
        });
    }

    private async mapStorageErrors<T>(
        action: () => Promise<T>,
        codes: {
            invalidKey?: (typeof FileErrors)[keyof typeof FileErrors];
            notFound?: (typeof FileErrors)[keyof typeof FileErrors];
        }
    ): Promise<T> {
        try {
            return await action();
        } catch (error) {
            this.rethrowMapped(error, codes);
        }
    }

    private rethrowMapped(
        error: unknown,
        codes: {
            invalidKey?: (typeof FileErrors)[keyof typeof FileErrors];
            notFound?: (typeof FileErrors)[keyof typeof FileErrors];
        }
    ): never {
        if (error instanceof InvalidStorageKeyError && codes.invalidKey) {
            throw new AppException(codes.invalidKey);
        }

        if (error instanceof StorageObjectNotFoundError && codes.notFound) {
            throw new AppException(codes.notFound);
        }

        if (error instanceof StorageWriteError && codes.invalidKey) {
            throw new AppException(codes.invalidKey);
        }

        throw error;
    }
}
