import { Module } from '@nestjs/common';

import { ExcelParserService } from './excel-parser.service';
import { ExcelProcessService } from '~/modules/excel/excel.service';

@Module({
    providers: [ExcelParserService, ExcelProcessService],
    exports: [ExcelProcessService],
})
export class ExcelProcessModule {}
