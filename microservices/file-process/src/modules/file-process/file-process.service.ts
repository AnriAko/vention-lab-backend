import { Injectable } from '@nestjs/common';

import {
    FileExtensions,
    FileProcessStatus,
} from '~/shared/file-processing/constants';
import type {
    FileProcessJobMessage,
    FileProcessResultMessage,
    FileProcessResultPayload,
} from '~/shared/file-processing/types';

import {
    PermanentProcessingError,
    TransientProcessingError,
} from './file-process.errors';
import { FileStorageService } from '~/shared/file-storage';
import { ExcelProcessService } from '~/modules/excel/excel.service';
import { MdProcessService } from '~/modules/md/md.service';
import {
    InvalidStorageKeyError,
    StorageObjectNotFoundError,
} from '~/shared/file-storage';

@Injectable()
export class FileProcessService {
    constructor(
        private readonly fileStorage: FileStorageService,
        private readonly excelProcessService: ExcelProcessService,
        private readonly mdProcessService: MdProcessService
    ) {}

    async processJob(
        job: FileProcessJobMessage
    ): Promise<FileProcessResultMessage> {
        try {
            const buffer = await this.fileStorage.getFileBuffer(job.storageKey);

            const extension = this.getExtension(job.storageKey);

            let result: FileProcessResultPayload;

            switch (true) {
                case FileExtensions.EXCEL.includes(extension):
                    result = await this.excelProcessService.process(
                        buffer,
                        job
                    );
                    break;

                case FileExtensions.MD.includes(extension):
                    result = await this.mdProcessService.process(buffer, job);
                    break;

                default:
                    throw new PermanentProcessingError(
                        `Unsupported file extension: .${extension}`
                    );
            }

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

    private getExtension(storageKey: string): string {
        const extension = storageKey.split('.').pop()?.toLowerCase();

        if (!extension) {
            throw new PermanentProcessingError('File extension is missing');
        }

        return extension;
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
