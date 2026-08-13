import { Injectable } from '@nestjs/common';
import { gunzipSync } from 'node:zlib';
import ExcelJS from 'exceljs';

import { FILE_PROCESSING_GZIP_SUFFIX } from '@shared/file-processing/constants';
import {
    EXCEL_HEADER_INDEX,
    EXCEL_SHEET_HEADERS,
} from '@shared/file-processing/excel-columns';
import type { FileProcessUserTotal } from '@shared/file-processing/messages';

export class ExcelValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExcelValidationError';
    }
}

type ParsedRow = {
    rowNumber: number;
    userEmail: string;
    organizationId: string;
    amount: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

@Injectable()
export class ExcelParserService {
    async parseAndAggregate(
        buffer: Buffer,
        storageKey: string,
        expectedOrganizationId: string
    ): Promise<FileProcessUserTotal[]> {
        const workbookBuffer = storageKey.endsWith(FILE_PROCESSING_GZIP_SUFFIX)
            ? gunzipSync(buffer)
            : buffer;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(workbookBuffer as unknown as ExcelJS.Buffer);

        const sheet = workbook.worksheets[0];
        if (!sheet) {
            throw new ExcelValidationError('Excel file has no worksheets');
        }

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

        const rows: ParsedRow[] = [];
        const errors: string[] = [];

        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) {
                return;
            }

            try {
                rows.push(
                    this.validateRow(row, rowNumber, expectedOrganizationId)
                );
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

        const totals = new Map<string, string>();

        for (const row of rows) {
            const current = totals.get(row.userEmail) ?? '0';
            totals.set(
                row.userEmail,
                this.addDecimalStrings(current, row.amount)
            );
        }

        return [...totals.entries()].map(([userEmail, amount]) => ({
            userEmail,
            amount,
        }));
    }

    private validateRow(
        row: ExcelJS.Row,
        rowNumber: number,
        expectedOrganizationId: string
    ): ParsedRow {
        const email = String(
            row.getCell(EXCEL_HEADER_INDEX.userEmail).text ?? ''
        )
            .trim()
            .toLowerCase();
        const organizationId = String(
            row.getCell(EXCEL_HEADER_INDEX.organization).text ?? ''
        ).trim();
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

        const amountRaw =
            amountCell.value === null || amountCell.value === undefined
                ? ''
                : String(
                      typeof amountCell.value === 'object' &&
                          amountCell.value !== null &&
                          'result' in amountCell.value
                          ? (amountCell.value as { result: unknown }).result
                          : amountCell.value
                  ).trim();

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

        const dateText = String(dateCell.text ?? '').trim();
        const dateValue = dateCell.value;
        const hasDate =
            dateValue instanceof Date ||
            (typeof dateValue === 'object' &&
                dateValue !== null &&
                'result' in dateValue &&
                (dateValue as { result: unknown }).result instanceof Date) ||
            (dateText.length > 0 &&
                !Number.isNaN(new Date(dateText).getTime()));

        if (!hasDate) {
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

    private addDecimalStrings(a: string, b: string): string {
        const [aIntRaw, aFracRaw = ''] = a.split('.');
        const [bIntRaw, bFracRaw = ''] = b.split('.');
        const scale = Math.max(aFracRaw.length, bFracRaw.length);
        const aInt =
            BigInt(
                `${aIntRaw}${aFracRaw.padEnd(scale, '0')}`.replace(/^-/, '') ||
                    '0'
            ) * (a.startsWith('-') ? -1n : 1n);
        const bInt =
            BigInt(
                `${bIntRaw}${bFracRaw.padEnd(scale, '0')}`.replace(/^-/, '') ||
                    '0'
            ) * (b.startsWith('-') ? -1n : 1n);
        const sum = aInt + bInt;
        const negative = sum < 0n;
        const digits = (negative ? -sum : sum)
            .toString()
            .padStart(scale + 1, '0');
        const whole = scale === 0 ? digits : digits.slice(0, -scale) || '0';
        const fraction = scale === 0 ? '' : digits.slice(-scale);
        const value = scale === 0 ? whole : `${whole}.${fraction}`;
        return negative ? `-${value}` : value;
    }
}
