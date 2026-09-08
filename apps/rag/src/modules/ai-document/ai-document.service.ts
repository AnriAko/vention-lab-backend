import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { chunkingConfig } from '~/config/configuration/chunking.config';
import { embeddingConfig } from '~/config/configuration/embedding.config';
import { ChunkingService } from '~/infrastructure/chunking/chunking.service';
import {
    DocumentParserService,
    UnsupportedDocumentFormatError,
} from '~/infrastructure/parsing/document-parser.service';
import { EmbeddingService } from '~/infrastructure/embedding/embedding.service';
import type { DocumentPoint } from '~/infrastructure/qdrant/document-point.model';
import { QdrantDocumentsService } from '~/infrastructure/qdrant/qdrant-documents.service';
import {
    AiDocumentExtensions,
    AiDocumentProcessStatus,
} from '@vention/rag-contract/constants';
import type {
    AiDocumentDeleteJobMessage,
    AiDocumentProcessJobMessage,
    AiDocumentProcessResultMessage,
    AiDocumentProcessResultPayload,
} from '@vention/rag-contract/types';
import {
    InvalidStorageKeyError,
    StorageObjectNotFoundError,
    FileStorageService,
} from '@vention/shared-file-storage';
import { LoggerService } from '@vention/shared-logger';

import {
    PermanentAiDocumentError,
    PermanentDeleteError,
    TransientAiDocumentError,
    TransientDeleteError,
} from './ai-document.errors';

import {
    type ChunkingStrategyName,
    type DocumentChunk,
} from '~/infrastructure/chunking/chunking.types';

import { decompressIfNeeded, getFileExtension } from './ai-document.utils';
@Injectable()
export class AiDocumentService {
    constructor(
        private readonly fileStorage: FileStorageService,
        private readonly documentParser: DocumentParserService,
        private readonly chunkingService: ChunkingService,
        private readonly embeddingService: EmbeddingService,
        private readonly qdrantDocuments: QdrantDocumentsService,
        private readonly logger: LoggerService,
        @Inject(chunkingConfig.KEY)
        private readonly chunking: ConfigType<typeof chunkingConfig>,
        @Inject(embeddingConfig.KEY)
        private readonly embedding: ConfigType<typeof embeddingConfig>
    ) {}

    async processJob(
        job: AiDocumentProcessJobMessage
    ): Promise<AiDocumentProcessResultMessage> {
        try {
            const storedBuffer = await this.fileStorage.getFileBuffer(
                job.storageKey
            );
            const buffer = await decompressIfNeeded(
                storedBuffer,
                job.storageKey
            );
            const extension = getFileExtension(job.storageKey);
            if (!this.isSupportedExtension(extension)) {
                throw new PermanentAiDocumentError(
                    `Unsupported file extension: .${extension}`
                );
            }

            const chunkCount = await this.ingestDocument(
                buffer,
                extension,
                job
            );

            this.logger.log(
                `Processed document fileId=${job.fileId} extension=${extension} chunks=${chunkCount}`
            );

            return this.buildResult(job, {
                status: AiDocumentProcessStatus.COMPLETED,
                success: true,
                error: null,
            });
        } catch (error) {
            if (this.isPermanentProcessError(error)) {
                return this.failedResult(
                    job,
                    error instanceof Error ? error.message : String(error)
                );
            }

            const message =
                error instanceof Error ? error.message : 'Unexpected error';

            throw new TransientAiDocumentError(message);
        }
    }

    async deleteJob(job: AiDocumentDeleteJobMessage): Promise<void> {
        try {
            this.logger.log(
                `[AiDocumentService] deleting Qdrant points documentId=${job.fileId}`
            );

            await this.qdrantDocuments.deleteByDocumentId(job.fileId);

            this.logger.log(
                `[AiDocumentService] deleted Qdrant points documentId=${job.fileId}`
            );
        } catch (error) {
            if (this.isPermanentDeleteError(error)) {
                throw error;
            }

            const message =
                error instanceof Error ? error.message : 'Unexpected error';

            throw new TransientDeleteError(message);
        }
    }

    processingResult(
        job: AiDocumentProcessJobMessage
    ): AiDocumentProcessResultMessage {
        return this.buildResult(job, {
            status: AiDocumentProcessStatus.PROCESSING,
            success: true,
            error: null,
        });
    }

    failedResult(
        job: AiDocumentProcessJobMessage,
        error: string
    ): AiDocumentProcessResultMessage {
        return this.buildResult(job, {
            status: AiDocumentProcessStatus.FAILED,
            success: false,
            error,
        });
    }

    isPermanentProcessError(error: unknown): boolean {
        return (
            error instanceof PermanentAiDocumentError ||
            error instanceof UnsupportedDocumentFormatError ||
            error instanceof InvalidStorageKeyError ||
            error instanceof StorageObjectNotFoundError
        );
    }

    isPermanentDeleteError(error: unknown): boolean {
        return error instanceof PermanentDeleteError;
    }

    private async ingestDocument(
        buffer: Buffer,
        extension: string,
        job: AiDocumentProcessJobMessage
    ): Promise<number> {
        const parsed = await this.documentParser.parse(buffer, extension);
        const chunks = this.chunkingService.chunk(parsed, {
            strategy: this.resolveChunkingStrategy(extension),
            maxChunkSize: this.chunking.maxChunkSize,
            overlap: this.chunking.overlap,
        });

        if (chunks.length === 0) {
            await this.qdrantDocuments.deleteByDocumentId(job.fileId);
            this.logger.log(`No chunks generated for documentId=${job.fileId}`);

            return 0;
        }

        await this.qdrantDocuments.deleteByDocumentId(job.fileId);

        const points = await this.createDocumentPoints(chunks, job);
        await this.qdrantDocuments.insertBatch(points);

        this.logger.log(
            `Ingested documentId=${job.fileId} chunks=${points.length}`
        );

        return points.length;
    }

    private async createDocumentPoints(
        chunks: DocumentChunk[],
        job: AiDocumentProcessJobMessage
    ): Promise<DocumentPoint[]> {
        const vectors = await this.embedInBatches(
            chunks.map((chunk) => chunk.text)
        );

        return chunks.map((chunk, index) => ({
            id: chunk.chunkId,
            vector: vectors[index],
            payload: {
                organizationId: job.organizationId,
                documentId: job.fileId,
                chunkId: chunk.chunkId,
                fileName: job.originalFilename,
                text: chunk.text,
            },
        }));
    }

    private async embedInBatches(texts: string[]): Promise<number[][]> {
        const batchSize = this.embedding.batchSize;
        const vectors: number[][] = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchVectors = await this.embeddingService.embedBatch(batch);
            vectors.push(...batchVectors);
        }

        return vectors;
    }

    private resolveChunkingStrategy(extension: string): ChunkingStrategyName {
        if (AiDocumentExtensions.PDF.includes(extension)) {
            return 'fixed-size';
        }

        return this.chunking.strategy;
    }

    private isSupportedExtension(extension: string): boolean {
        return Object.values(AiDocumentExtensions).flat().includes(extension);
    }

    private buildResult(
        job: AiDocumentProcessJobMessage,
        result: AiDocumentProcessResultPayload
    ): AiDocumentProcessResultMessage {
        return {
            fileId: job.fileId,
            organizationId: job.organizationId,
            ownerId: job.ownerId,
            ...result,
        };
    }
}
