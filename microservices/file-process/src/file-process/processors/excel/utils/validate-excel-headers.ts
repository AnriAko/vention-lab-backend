import type ExcelJS from 'exceljs';

import { EXCEL_SHEET_HEADERS } from '@shared/file-processing/excel-columns';
import { ExcelValidationError } from '../excel-validation.error';

export function validateExcelHeaders(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(1);

    for (let i = 0; i < EXCEL_SHEET_HEADERS.length; i++) {
        const expected = EXCEL_SHEET_HEADERS[i];
        const actual = String(headerRow.getCell(i + 1).text ?? '').trim();

        if (actual !== expected) {
            throw new ExcelValidationError(
                `Invalid header at column ${i + 1}: expected "${expected}", got "${actual}"`
            );
        }
    }
}
