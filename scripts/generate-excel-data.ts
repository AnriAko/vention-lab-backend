import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import ExcelJS from 'exceljs';

import { disconnect, prisma } from '../prisma/client';

const OUTPUT_DIR = path.join(process.cwd(), 'excel-data');
const DEFAULT_ROW_COUNT = 100;

const HEADERS = [
    'User email',
    'Organization',
    'Transaction size',
    'Date',
] as const;

type MembershipRow = {
    userEmail: string;
    organizationId: string;
};

function parseRowCount(): number {
    const raw = process.env.EXCEL_ROW_COUNT ?? process.argv[2];
    if (!raw) {
        return DEFAULT_ROW_COUNT;
    }

    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value) || value < 1) {
        throw new Error(
            `Invalid row count "${raw}". Use a positive integer (env EXCEL_ROW_COUNT or argv).`
        );
    }

    return value;
}

function randomFloat(min: number, max: number, decimals = 2): number {
    const value = Math.random() * (max - min) + min;
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function randomDate(from: Date, to: Date): Date {
    const start = from.getTime();
    const end = to.getTime();
    return new Date(start + Math.random() * (end - start));
}

function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

async function loadMemberships(): Promise<MembershipRow[]> {
    const memberships = await prisma.usersOrganizations.findMany({
        where: {
            isDeleted: false,
            organization: {
                isDeleted: false,
            },
        },
        select: {
            organizationId: true,
            user: {
                select: {
                    email: true,
                },
            },
        },
    });

    return memberships.map((membership) => ({
        userEmail: membership.user.email,
        organizationId: membership.organizationId,
    }));
}

async function generateWorkbook(
    memberships: MembershipRow[],
    rowCount: number
): Promise<string> {
    await mkdir(OUTPUT_DIR, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'vention-lab-backend';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Transactions');
    sheet.addRow([...HEADERS]);

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    const dateFrom = new Date('2023-01-01T00:00:00.000Z');
    const dateTo = new Date();

    for (let i = 0; i < rowCount; i++) {
        const membership = pickRandom(memberships);
        const date = randomDate(dateFrom, dateTo);

        sheet.addRow([
            membership.userEmail,
            membership.organizationId,
            randomFloat(1, 50_000, 2),
            date.toISOString().slice(0, 10),
        ]);
    }

    sheet.columns = [
        { key: 'email', width: 36 },
        { key: 'organization', width: 40 },
        { key: 'transactionSize', width: 18 },
        { key: 'date', width: 14 },
    ];

    const timestamp = new Date()
        .toISOString()
        .replaceAll(':', '-')
        .replace(/\.\d{3}Z$/, 'Z');
    const outputPath = path.join(OUTPUT_DIR, `transactions-${timestamp}.xlsx`);

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
}

async function main() {
    const rowCount = parseRowCount();

    console.log(`Generating Excel with ${rowCount} data rows...`);

    const memberships = await loadMemberships();

    if (!memberships.length) {
        throw new Error(
            'No active user–organization memberships found. Seed the database first (npm run prisma:seed).'
        );
    }

    console.log(`Loaded ${memberships.length} memberships from DB`);

    const outputPath = await generateWorkbook(memberships, rowCount);

    console.log(`Excel file written to: ${outputPath}`);
}

main()
    .then(disconnect)
    .catch(async (error: unknown) => {
        console.error('Failed to generate Excel data:', error);
        await disconnect().catch(() => undefined);
        process.exit(1);
    });
