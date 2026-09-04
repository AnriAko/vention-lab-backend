import { Module } from '@nestjs/common';

import { ExcelProcessModule } from '~/modules/excel/excel.module';
import { FileStorageModule } from '@vention/shared-file-storage';

import { FileProcessController } from './file-process.controller';
import { FileProcessStatusPublisher } from './file-process.result.publisher';
import { FileProcessService } from './file-process.service';

@Module({
    imports: [ExcelProcessModule, FileStorageModule],
    controllers: [FileProcessController],
    providers: [FileProcessService, FileProcessStatusPublisher],
})
export class FileProcessModule {}
