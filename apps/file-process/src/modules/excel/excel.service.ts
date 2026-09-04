import { Injectable } from '@nestjs/common';

import { FileProcessStatus } from '~/shared/file-process-contract';
import type {
    FileProcessJobMessage,
    FileProcessResultPayload,
} from '~/shared/file-process-contract/types';
import { LoggerService } from '~/shared/logger';

import { ExcelParserService } from './excel-parser.service';

@Injectable()
export class ExcelProcessService {
    constructor(
        private readonly excelParser: ExcelParserService,
        private readonly logger: LoggerService
    ) {}

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
