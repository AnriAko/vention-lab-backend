import { Module } from '@nestjs/common';

import { ExcelProcessModule } from '../excel/excel.module';
import { FileStorageModule } from '~/shared/file-storage';

import { FileProcessConsumer } from './file-process.consumer';
import { FileProcessService } from './file-process.service';

@Module({
    imports: [ExcelProcessModule, FileStorageModule],
    providers: [FileProcessService, FileProcessConsumer],
})
export class FileProcessModule {}
