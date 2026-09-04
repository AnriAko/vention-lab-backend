import { Injectable } from '@nestjs/common';

import { MdProcessService } from '~/modules/md/md.service';
import {
    RagFileExtensions,
    RagProcessStatus,
} from '~/shared/rag-contract/constants';
import type {
    RagProcessJobMessage,
    RagProcessResultMessage,
    RagProcessResultPayload,
} from '~/shared/rag-contract/types';
import {
    InvalidStorageKeyError,
    StorageObjectNotFoundError,
    FileStorageService,
} from '~/shared/file-storage';

import { PermanentRagError, TransientRagError } from './rag-process.errors';

@Injectable()
export class RagProcessService {
    constructor(
        private readonly fileStorage: FileStorageService,
        private readonly mdProcessService: MdProcessService
    ) {}

    async processJob(
        job: RagProcessJobMessage
    ): Promise<RagProcessResultMessage> {
        try {
            const buffer = await this.fileStorage.getFileBuffer(job.storageKey);
            const extension = this.getExtension(job.storageKey);

            if (!RagFileExtensions.MD.includes(extension)) {
                throw new PermanentRagError(
                    `Unsupported file extension: .${extension}`
                );
            }

            const result = await this.mdProcessService.process(buffer, job);
            return this.buildResult(job, result);
        } catch (error) {
            if (this.isPermanentError(error)) {
                return this.failedResult(
                    job,
                    error instanceof Error ? error.message : String(error)
                );
            }

            const message =
                error instanceof Error ? error.message : 'Unexpected error';

            throw new TransientRagError(message);
        }
    }

    private getExtension(storageKey: string): string {
        const withoutGzip = storageKey.endsWith('.gz')
            ? storageKey.slice(0, -3)
            : storageKey;
        const extension = withoutGzip.split('.').pop()?.toLowerCase();

        if (!extension) {
            throw new PermanentRagError('File extension is missing');
        }

        return extension;
    }

    failedResult(
        job: RagProcessJobMessage,
        error: string
    ): RagProcessResultMessage {
        return this.buildResult(job, {
            status: RagProcessStatus.FAILED,
            success: false,
            error,
        });
    }

    processingResult(job: RagProcessJobMessage): RagProcessResultMessage {
        return this.buildResult(job, {
            status: RagProcessStatus.PROCESSING,
            success: true,
            error: null,
        });
    }

    isPermanentError(error: unknown): boolean {
        return (
            error instanceof PermanentRagError ||
            error instanceof InvalidStorageKeyError ||
            error instanceof StorageObjectNotFoundError
        );
    }

    private buildResult(
        job: RagProcessJobMessage,
        result: RagProcessResultPayload
    ): RagProcessResultMessage {
        return {
            fileId: job.fileId,
            organizationId: job.organizationId,
            ownerId: job.ownerId,
            ...result,
        };
    }
}
