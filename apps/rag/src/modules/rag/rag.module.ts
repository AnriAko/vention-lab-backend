import { Module } from '@nestjs/common';

import { MdProcessModule } from '../md/md.module';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';
import { FileStorageModule } from '@vention/shared-file-storage';

import { RagFileDeleteService } from './rag-file-delete.service';
import { RagFileProcessService } from './rag-file-process.service';
import { RagFileWorker } from './rag.worker';

@Module({
    imports: [MdProcessModule, QdrantDocumentsModule, FileStorageModule],
    providers: [RagFileProcessService, RagFileDeleteService, RagFileWorker],
})
export class RagModule {}
