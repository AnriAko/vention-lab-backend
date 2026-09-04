import type ExcelJS from 'exceljs';

import { ExcelValidationError } from '../excel-validation.error';
import type { ParsedRow } from '../types/parsed-row.type';
import { validateExcelRow } from './validate-excel-row';

export function collectExcelRows(
    sheet: ExcelJS.Worksheet,
    expectedOrganizationId: string
): ParsedRow[] {
    const rows: ParsedRow[] = [];
    const errors: string[] = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
            return;
        }

        try {
            rows.push(validateExcelRow(row, rowNumber, expectedOrganizationId));
        } catch (error) {
            errors.push(
                error instanceof Error
                    ? error.message
                    : `Row ${rowNumber}: invalid`
            );
        }
    });

    if (rows.length === 0 && errors.length === 0) {
        throw new ExcelValidationError('Excel file has no data rows');
    }

    if (errors.length > 0) {
        throw new ExcelValidationError(errors.join('; '));
    }

    return rows;
}
