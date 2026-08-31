import type ExcelJS from 'exceljs';

import { EXCEL_HEADER_INDEX } from '@shared/file-processing/excel-columns';
import { DECIMAL_RE, EMAIL_RE, UUID_RE } from '../excel-parser.constants';
import { ExcelValidationError } from '../excel-validation.error';
import type { ParsedRow } from '../types/parsed-row.type';

export function validateExcelRow(
    row: ExcelJS.Row,
    rowNumber: number,
    expectedOrganizationId: string
): ParsedRow {
    const email = getCellText(
        row.getCell(EXCEL_HEADER_INDEX.userEmail)
    ).toLowerCase();
    const organizationId = getCellText(
        row.getCell(EXCEL_HEADER_INDEX.organization)
    );
    const amountCell = row.getCell(EXCEL_HEADER_INDEX.transactionSize);
    const dateCell = row.getCell(EXCEL_HEADER_INDEX.date);

    if (!email || !EMAIL_RE.test(email)) {
        throw new ExcelValidationError(
            `Row ${rowNumber}: User email is invalid`
        );
    }

    if (!organizationId || !UUID_RE.test(organizationId)) {
        throw new ExcelValidationError(
            `Row ${rowNumber}: Organization must be a valid UUID`
        );
    }

    if (organizationId !== expectedOrganizationId) {
        throw new ExcelValidationError(
            `Row ${rowNumber}: Organization does not match file organization`
        );
    }

    const amountRaw = getNumericCellText(amountCell);

    if (!amountRaw || !DECIMAL_RE.test(amountRaw)) {
        throw new ExcelValidationError(
            `Row ${rowNumber}: amount must be a valid decimal number`
        );
    }

    if (Number(amountRaw) <= 0) {
        throw new ExcelValidationError(
            `Row ${rowNumber}: amount must be greater than zero`
        );
    }

    if (!hasExcelDate(dateCell)) {
        throw new ExcelValidationError(
            `Row ${rowNumber}: Date has invalid format`
        );
    }

    return {
        rowNumber,
        userEmail: email,
        organizationId,
        amount: amountRaw,
    };
}

function getCellText(cell: ExcelJS.Cell): string {
    return String(cell.text ?? '').trim();
}

function getNumericCellText(cell: ExcelJS.Cell): string {
    if (cell.value === null || cell.value === undefined) {
        return '';
    }

    const value =
        typeof cell.value === 'object' &&
        cell.value !== null &&
        'result' in cell.value
            ? (cell.value as { result: unknown }).result
            : cell.value;

    return String(value).trim();
}

function hasExcelDate(cell: ExcelJS.Cell): boolean {
    const dateText = getCellText(cell);
    const dateValue = cell.value;

    return (
        dateValue instanceof Date ||
        (typeof dateValue === 'object' &&
            dateValue !== null &&
            'result' in dateValue &&
            (dateValue as { result: unknown }).result instanceof Date) ||
        (dateText.length > 0 && !Number.isNaN(new Date(dateText).getTime()))
    );
}
