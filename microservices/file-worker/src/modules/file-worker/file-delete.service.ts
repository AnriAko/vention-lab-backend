import { Injectable } from '@nestjs/common';

import { QdrantDocumentsService } from '~/infrastructure/qdrant/qdrant-documents.service';
import type { FileDeleteJobMessage } from '~/shared/file-worker-contract/types';

import {
    PermanentDeleteError,
    TransientDeleteError,
} from './file-delete.errors';

@Injectable()
export class FileDeleteService {
    constructor(
        private readonly qdrantDocuments: QdrantDocumentsService
    ) {}

    async deleteJob(job: FileDeleteJobMessage): Promise<void> {
        try {
            await this.qdrantDocuments.deleteByDocumentId(job.fileId);
        } catch (error) {
            if (this.isPermanentError(error)) {
                throw error;
            }

            const message =
                error instanceof Error ? error.message : 'Unexpected error';

            throw new TransientDeleteError(message);
        }
    }

    isPermanentError(error: unknown): boolean {
        return error instanceof PermanentDeleteError;
    }
}
