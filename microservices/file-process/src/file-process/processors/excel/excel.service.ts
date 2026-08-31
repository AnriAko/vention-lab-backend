import { Injectable, Logger } from '@nestjs/common';

import { FileProcessStatus } from '~/shared/file-processing';
import type {
    FileProcessJobMessage,
    FileProcessResultPayload,
} from '~/shared/file-processing/types';

import { ExcelParserService } from './excel-parser.service';

@Injectable()
export class ExcelProcessService {
    private readonly logger = new Logger(ExcelProcessService.name);

    constructor(private readonly excelParser: ExcelParserService) {}

    async process(
        buffer: Buffer,
        job: FileProcessJobMessage
    ): Promise<FileProcessResultPayload> {
        const totals = await this.excelParser.parseAndAggregate(
            buffer,
            job.storageKey,
            job.organizationId
        );

        this.logger.log(
            `Parsed Excel fileId=${job.fileId} users=${totals.length}`
        );

        return {
            status: FileProcessStatus.COMPLETED,
            success: true,
            error: null,
            totals,
        };
    }
}
