import type { FileProcessUserTotal } from '~/shared/file-process-contract/types';

import type { ParsedRow } from '../types/parsed-row.type';
import { addDecimalStrings } from './add-decimal-strings';

export function aggregateUserTotals(rows: ParsedRow[]): FileProcessUserTotal[] {
    const totals = new Map<string, string>();

    for (const row of rows) {
        const current = totals.get(row.userEmail) ?? '0';
        totals.set(row.userEmail, addDecimalStrings(current, row.amount));
    }

    return [...totals.entries()].map(([userEmail, amount]) => ({
        userEmail,
        amount,
    }));
}
