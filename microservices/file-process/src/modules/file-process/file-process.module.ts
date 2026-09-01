import { Module } from '@nestjs/common';

import { ExcelProcessModule } from '../excel/excel.module';
import { MdProcessModule } from '../md/md.module';
import { FileProcessConsumer } from './file-process.consumer';
import { FileProcessService } from './file-process.service';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';
import { FileStorageModule } from '~/shared/file-storage';

@Module({
    imports: [
        ExcelProcessModule,
        MdProcessModule,
        QdrantDocumentsModule,
        FileStorageModule,
    ],
    providers: [FileProcessService, FileProcessConsumer],
})
export class FileProcessModule {}
