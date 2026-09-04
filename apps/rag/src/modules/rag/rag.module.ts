import { Module } from '@nestjs/common';

import { MdProcessModule } from '../md/md.module';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';
import { FileStorageModule } from '@vention/shared-file-storage';

import { RagDeleteService } from './rag-delete.service';
import { RagProcessService } from './rag-process.service';
import { RagWorker } from './rag.worker';

@Module({
    imports: [MdProcessModule, QdrantDocumentsModule, FileStorageModule],
    providers: [RagProcessService, RagDeleteService, RagWorker],
})
export class RagModule {}
