import { Module } from '@nestjs/common';

import { ExcelProcessModule } from '../excel/excel.module';
import { MdProcessModule } from '../md/md.module';
import { FileDeleteService } from './file-delete.service';
import { FileWorkerService } from './file-worker.service';
import { FileWorker } from './file-worker';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';
import { FileStorageModule } from '~/shared/file-storage';

@Module({
    imports: [
        ExcelProcessModule,
        MdProcessModule,
        QdrantDocumentsModule,
        FileStorageModule,
    ],
    providers: [FileWorkerService, FileDeleteService, FileWorker],
})
export class FileWorkerModule {}
