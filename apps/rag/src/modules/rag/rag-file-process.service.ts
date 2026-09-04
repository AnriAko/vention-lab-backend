import { Injectable } from '@nestjs/common';

import { MdProcessService as MdFileProcessService } from '~/modules/md/md.service';
import {
    RagFileExtensions,
    RagProcessStatus as RagFileProcessStatus,
} from '@vention/rag-contract/constants';
import type {
    RagFileProcessJobMessage as RagFileProcessJobMessage,
    RagProcessResultMessage as RagFileProcessResultMessage,
    RagFileProcessResultPayload,
} from '@vention/rag-contract/types';
import {
    InvalidStorageKeyError,
    StorageObjectNotFoundError,
    FileStorageService,
} from '@vention/shared-file-storage';

import {
    PermanentRagError as PermanentRagFileError,
    TransientRagError as TransientRagFileError,
} from './rag-file-process.errors';

@Injectable()
export class RagFileProcessService {
    constructor(
        private readonly fileStorage: FileStorageService,
        private readonly mdProcessService: MdFileProcessService
    ) {}

    async processJob(
        job: RagFileProcessJobMessage
    ): Promise<RagFileProcessResultMessage> {
        try {
            const buffer = await this.fileStorage.getFileBuffer(job.storageKey);
            const extension = this.getExtension(job.storageKey);

            if (!RagFileExtensions.MD.includes(extension)) {
                throw new PermanentRagFileError(
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

            throw new TransientRagFileError(message);
        }
    }

    private getExtension(storageKey: string): string {
        const withoutGzip = storageKey.endsWith('.gz')
            ? storageKey.slice(0, -3)
            : storageKey;
        const extension = withoutGzip.split('.').pop()?.toLowerCase();

        if (!extension) {
            throw new PermanentRagFileError('File extension is missing');
        }

        return extension;
    }

    failedResult(
        job: RagFileProcessJobMessage,
        error: string
    ): RagFileProcessResultMessage {
        return this.buildResult(job, {
            status: RagFileProcessStatus.FAILED,
            success: false,
            error,
        });
    }

    processingResult(
        job: RagFileProcessJobMessage
    ): RagFileProcessResultMessage {
        return this.buildResult(job, {
            status: RagFileProcessStatus.PROCESSING,
            success: true,
            error: null,
        });
    }

    isPermanentError(error: unknown): boolean {
        return (
            error instanceof PermanentRagFileError ||
            error instanceof InvalidStorageKeyError ||
            error instanceof StorageObjectNotFoundError
        );
    }

    private buildResult(
        job: RagFileProcessJobMessage,
        result: RagFileProcessResultPayload
    ): RagFileProcessResultMessage {
        return {
            fileId: job.fileId,
            organizationId: job.organizationId,
            ownerId: job.ownerId,
            ...result,
        };
    }
}
