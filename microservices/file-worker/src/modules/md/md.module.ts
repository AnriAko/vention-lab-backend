import { Module } from '@nestjs/common';

import { DocumentsModule } from '~/infrastructure/documents/documents.module';

import { MdProcessService } from './md.service';

@Module({
    imports: [DocumentsModule],
    providers: [MdProcessService],
    exports: [MdProcessService],
})
export class MdProcessModule {}
