import { Module } from '@nestjs/common';

import { RabbitmqModule } from '~/rabbitmq/rabbitmq.module';
import { ExcelParserService } from './excel-parser.service';
import { FileProcessConsumer } from './file-process.consumer';
import { FileProcessService } from './file-process.service';
import { FileStorageService } from './file-storage.service';

@Module({
    imports: [RabbitmqModule],
    providers: [
        FileStorageService,
        ExcelParserService,
        FileProcessService,
        FileProcessConsumer,
    ],
})
export class FileProcessModule {}
