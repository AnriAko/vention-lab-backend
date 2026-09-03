export const EXCEL_SHEET_HEADERS = [
    'User email',
    'Organization',
    'Transaction size',
    'Date',
] as const;

export type ExcelSheetHeader = (typeof EXCEL_SHEET_HEADERS)[number];

export const EXCEL_HEADER_INDEX = {
    userEmail: 1,
    organization: 2,
    transactionSize: 3,
    date: 4,
} as const;
