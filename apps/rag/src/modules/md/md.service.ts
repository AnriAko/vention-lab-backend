import { Injectable } from '@nestjs/common';

import { DocumentIngestionService } from '~/infrastructure/documents/document-ingestion.service';
import { RagProcessStatus } from '@vention/rag-contract';
import type {
    RagProcessJobMessage,
    RagProcessResultPayload,
} from '@vention/rag-contract/types';
import { LoggerService } from '@vention/shared-logger';

@Injectable()
export class MdProcessService {
    constructor(
        private readonly documentIngestion: DocumentIngestionService,
        private readonly logger: LoggerService
    ) {}

    async process(
        buffer: Buffer,
        job: RagProcessJobMessage
    ): Promise<RagProcessResultPayload> {
        const chunkCount = await this.documentIngestion.ingestMarkdown(buffer, {
            organizationId: job.organizationId,
            documentId: job.fileId,
            fileName: job.originalFilename,
        });

        this.logger.log(
            `Processed Markdown fileId=${job.fileId} chunks=${chunkCount}`
        );

        return {
            status: RagProcessStatus.COMPLETED,
            success: true,
            error: null,
        };
    }
}
