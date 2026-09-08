import { Injectable } from '@nestjs/common';

import {
    FileExtensions,
    FileProcessStatus,
} from '@vention/file-process-contract/constants';
import type {
    FileProcessJobMessage,
    FileProcessResultMessage,
    FileProcessResultPayload,
} from '@vention/file-process-contract/types';
import {
    InvalidStorageKeyError,
    StorageObjectNotFoundError,
} from '@vention/shared-file-storage';
import { FileStorageService } from '@vention/shared-file-storage';
import { ExcelProcessService } from '~/modules/excel/excel.service';

import {
    PermanentProcessingError,
    TransientProcessingError,
} from './file-process.errors';
import { getFileExtension } from '~/modules/file-process/file-process.utils';

@Injectable()
export class FileProcessService {
    constructor(
        private readonly fileStorage: FileStorageService,
        private readonly excelProcessService: ExcelProcessService
    ) {}

    async processJob(
        job: FileProcessJobMessage
    ): Promise<FileProcessResultMessage> {
        try {
            const buffer = await this.fileStorage.getFileBuffer(job.storageKey);

            const extension = getFileExtension(job.storageKey);

            if (!extension) {
                throw new PermanentProcessingError('File extension is missing');
            }

            if (!FileExtensions.EXCEL.includes(extension)) {
                throw new PermanentProcessingError(
                    `Unsupported file extension: .${extension}`
                );
            }

            const result = await this.excelProcessService.process(buffer, job);

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

            throw new TransientProcessingError(message);
        }
    }

    failedResult(
        job: FileProcessJobMessage,
        error: string
    ): FileProcessResultMessage {
        return this.buildResult(job, {
            status: FileProcessStatus.FAILED,
            success: false,
            error,
            totals: null,
        });
    }

    processingResult(job: FileProcessJobMessage): FileProcessResultMessage {
        return this.buildResult(job, {
            status: FileProcessStatus.PROCESSING,
            success: true,
            error: null,
            totals: null,
        });
    }

    isPermanentError(error: unknown): boolean {
        return (
            error instanceof PermanentProcessingError ||
            error instanceof InvalidStorageKeyError ||
            error instanceof StorageObjectNotFoundError
        );
    }

    private buildResult(
        job: FileProcessJobMessage,
        result: FileProcessResultPayload
    ): FileProcessResultMessage {
        return {
            fileId: job.fileId,
            organizationId: job.organizationId,
            ownerId: job.ownerId,
            ...result,
        };
    }
}
