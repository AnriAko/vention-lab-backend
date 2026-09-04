import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { chunkingConfig } from '~/config/configuration/chunking.config';
import { embeddingConfig } from '~/config/configuration/embedding.config';
import { ChunkingService } from '~/infrastructure/chunking/chunking.service';
import type { DocumentChunk } from '~/infrastructure/chunking/chunking.types';
import { EmbeddingService } from '~/infrastructure/embedding/embedding.service';
import { MarkdownParserService } from '~/infrastructure/parsing/markdown/markdown-parser.service';
import type { DocumentPoint } from '~/infrastructure/qdrant/document-point.model';
import { QdrantDocumentsService } from '~/infrastructure/qdrant/qdrant-documents.service';
import { LoggerService } from '@vention/shared-logger';

import type { DocumentIngestionContext } from './document-ingestion.types';

@Injectable()
export class DocumentIngestionService {
    constructor(
        private readonly markdownParser: MarkdownParserService,
        private readonly chunkingService: ChunkingService,
        private readonly embeddingService: EmbeddingService,
        private readonly qdrantDocuments: QdrantDocumentsService,
        private readonly logger: LoggerService,
        @Inject(chunkingConfig.KEY)
        private readonly chunking: ConfigType<typeof chunkingConfig>,
        @Inject(embeddingConfig.KEY)
        private readonly embedding: ConfigType<typeof embeddingConfig>
    ) {}

    async ingestMarkdown(
        buffer: Buffer,
        context: DocumentIngestionContext
    ): Promise<number> {
        this.assertContext(context);

        const parsed = this.markdownParser.parse(buffer);
        const chunks = this.chunkingService.chunk(parsed, {
            strategy: this.chunking.strategy,
            maxChunkSize: this.chunking.maxChunkSize,
            overlap: this.chunking.overlap,
        });

        if (chunks.length === 0) {
            await this.qdrantDocuments.deleteByDocumentId(context.documentId);
            this.logger.log(
                `No chunks generated for documentId=${context.documentId}`
            );

            return 0;
        }

        await this.qdrantDocuments.deleteByDocumentId(context.documentId);

        const points = await this.createDocumentPoints(chunks, context);
        await this.qdrantDocuments.insertBatch(points);

        this.logger.log(
            `Ingested documentId=${context.documentId} chunks=${points.length}`
        );

        return points.length;
    }

    private async createDocumentPoints(
        chunks: DocumentChunk[],
        context: DocumentIngestionContext
    ): Promise<DocumentPoint[]> {
        const vectors = await this.embedInBatches(
            chunks.map((chunk) => chunk.text)
        );

        return chunks.map((chunk, index) => ({
            id: chunk.chunkId,
            vector: vectors[index]!,
            payload: {
                organizationId: context.organizationId,
                documentId: context.documentId,
                chunkId: chunk.chunkId,
                fileName: context.fileName,
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

    private assertContext(context: DocumentIngestionContext): void {
        if (!context.organizationId?.trim()) {
            throw new Error(
                'organizationId is required for document ingestion'
            );
        }

        if (!context.documentId?.trim()) {
            throw new Error('documentId is required for document ingestion');
        }

        if (!context.fileName?.trim()) {
            throw new Error('fileName is required for document ingestion');
        }
    }
}
