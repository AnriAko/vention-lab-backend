import { Injectable } from '@nestjs/common';

import type { FileProcessUserTotal } from '~/shared/file-process-contract/types';

import { aggregateUserTotals } from './utils/aggregate-user-totals';
import { collectExcelRows } from './utils/collect-excel-rows';
import { decompressWorkbookBuffer } from './utils/decompress-workbook-buffer';
import { loadFirstWorksheet } from './utils/load-first-worksheet';
import { validateExcelHeaders } from './utils/validate-excel-headers';

@Injectable()
export class ExcelParserService {
    async parseAndAggregate(
        buffer: Buffer,
        storageKey: string,
        expectedOrganizationId: string
    ): Promise<FileProcessUserTotal[]> {
        const workbookBuffer = decompressWorkbookBuffer(buffer, storageKey);
        const sheet = await loadFirstWorksheet(workbookBuffer);

        validateExcelHeaders(sheet);

        const rows = collectExcelRows(sheet, expectedOrganizationId);

        return aggregateUserTotals(rows);
    }
}
