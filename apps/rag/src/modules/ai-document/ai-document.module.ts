import { Module } from '@nestjs/common';

import { ChunkingModule } from '~/infrastructure/chunking/chunking.module';
import { EmbeddingModule } from '~/infrastructure/embedding/embedding.module';
import { ParsingModule } from '~/infrastructure/parsing/parsing.module';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';
import { FileStorageModule } from '@vention/shared-file-storage';

import { AiDocumentController } from './ai-document.controller';
import { AiDocumentService } from './ai-document.service';
import { AiDocumentPublisher } from './ai-document.publisher';
import { AiDocumentErrorHandler } from '~/modules/ai-document/ai-document.error-handler';

@Module({
    imports: [
        FileStorageModule,
        ParsingModule,
        ChunkingModule,
        EmbeddingModule,
        QdrantDocumentsModule,
    ],
    controllers: [AiDocumentController],
    providers: [AiDocumentService, AiDocumentPublisher, AiDocumentErrorHandler],
})
export class AiDocumentModule {}
