import { Injectable } from '@nestjs/common';

import { FileProcessStatus } from '~/shared/file-worker-contract';
import type {
    FileProcessJobMessage,
    FileProcessResultPayload,
} from '~/shared/file-worker-contract/types';
import { LoggerService } from '~/shared/logger';

import { DocumentIngestionService } from '~/infrastructure/documents/document-ingestion.service';

@Injectable()
export class MdProcessService {
    constructor(
        private readonly documentIngestion: DocumentIngestionService,
        private readonly logger: LoggerService
    ) {}

    async process(
        buffer: Buffer,
        job: FileProcessJobMessage
    ): Promise<FileProcessResultPayload> {
        const chunkCount = await this.documentIngestion.ingestMarkdown(buffer, {
            organizationId: job.organizationId,
            documentId: job.fileId,
            fileName: job.originalFilename,
        });

        this.logger.log(
            `Processed Markdown fileId=${job.fileId} chunks=${chunkCount}`
        );

        return {
            status: FileProcessStatus.COMPLETED,
            success: true,
            error: null,
            totals: null,
        };
    }
}
