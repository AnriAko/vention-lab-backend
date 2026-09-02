import { Module } from '@nestjs/common';

import { ChunkingModule } from '~/infrastructure/chunking/chunking.module';
import { EmbeddingModule } from '~/infrastructure/embedding/embedding.module';
import { ParsingModule } from '~/infrastructure/parsing/parsing.module';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';

import { DocumentIngestionService } from './document-ingestion.service';

@Module({
    imports: [
        ParsingModule,
        ChunkingModule,
        EmbeddingModule,
        QdrantDocumentsModule,
    ],
    providers: [DocumentIngestionService],
    exports: [DocumentIngestionService],
})
export class DocumentsModule {}
