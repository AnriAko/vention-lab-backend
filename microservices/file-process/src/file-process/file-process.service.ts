import { Injectable, Logger } from '@nestjs/common';

import {
    FileProcessStatus,
    type FileProcessJobMessage,
    type FileProcessResultMessage,
} from '@shared/file-processing/messages';
import {
    ExcelParserService,
    ExcelValidationError,
} from './excel-parser.service';
import {
    FileStorageService,
    InvalidStorageKeyError,
    StorageObjectNotFoundError,
} from './file-storage.service';

export class PermanentProcessingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermanentProcessingError';
    }
}

export class TransientProcessingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransientProcessingError';
    }
}

@Injectable()
export class FileProcessService {
    private readonly logger = new Logger(FileProcessService.name);

    constructor(
        private readonly fileStorage: FileStorageService,
        private readonly excelParser: ExcelParserService
    ) {}

    async processJob(
        job: FileProcessJobMessage
    ): Promise<FileProcessResultMessage> {
        try {
            const buffer = await this.fileStorage.getFileBuffer(job.storageKey);
            const totals = await this.excelParser.parseAndAggregate(
                buffer,
                job.storageKey,
                job.organizationId
            );

            this.logger.log(
                `Parsed fileId=${job.fileId} users=${totals.length}`
            );

            return this.buildResult(job, {
                status: FileProcessStatus.COMPLETED,
                success: true,
                error: null,
                totals,
            });
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
            error instanceof ExcelValidationError ||
            error instanceof PermanentProcessingError ||
            error instanceof InvalidStorageKeyError ||
            error instanceof StorageObjectNotFoundError
        );
    }

    private buildResult(
        job: FileProcessJobMessage,
        result: Pick<
            FileProcessResultMessage,
            'status' | 'success' | 'error' | 'totals'
        >
    ): FileProcessResultMessage {
        return {
            fileId: job.fileId,
            organizationId: job.organizationId,
            ownerId: job.ownerId,
            ...result,
        };
    }
}
