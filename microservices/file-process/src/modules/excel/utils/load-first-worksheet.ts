import ExcelJS from 'exceljs';

import { ExcelValidationError } from '../excel-validation.error';

export async function loadFirstWorksheet(
    buffer: Buffer
): Promise<ExcelJS.Worksheet> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
        throw new ExcelValidationError('Excel file has no worksheets');
    }

    return sheet;
}
