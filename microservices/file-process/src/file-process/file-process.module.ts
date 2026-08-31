import { Module } from '@nestjs/common';

import { RabbitmqModule } from '~/rabbitmq/rabbitmq.module';

import { ExcelProcessModule } from './processors/excel/excel.module';
import { FileProcessConsumer } from './file-process.consumer';
import { FileProcessService } from './file-process.service';
import { FileStorageService } from './file-storage.service';

@Module({
    imports: [RabbitmqModule, ExcelProcessModule],
    providers: [FileStorageService, FileProcessService, FileProcessConsumer],
})
export class FileProcessModule {}
