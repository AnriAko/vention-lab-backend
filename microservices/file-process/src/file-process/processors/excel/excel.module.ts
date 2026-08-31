import { Module } from '@nestjs/common';

import { ExcelParserService } from './excel-parser.service';
import { ExcelProcessService } from '~/file-process/processors/excel/excel.service';

@Module({
    providers: [ExcelParserService, ExcelProcessService],
    exports: [ExcelProcessService],
})
export class ExcelProcessModule {}
