import { Module } from '@nestjs/common';

import { QdrantDocumentsService } from './qdrant-documents.service';

@Module({
    providers: [QdrantDocumentsService],
    exports: [QdrantDocumentsService],
})
export class QdrantDocumentsModule {}
