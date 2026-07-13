import 'dotenv/config';

import { Pool } from 'pg';
import { format } from 'sql-formatter';

import { loadPrismaEnv } from '../../../src/config/prisma/prisma-env';
import { EXPLAIN_ANALYZE, QUERY_TO_EXPLAIN } from './query-to-explain';

const { DATABASE_URL } = loadPrismaEnv();

const pool = new Pool({
    connectionString: DATABASE_URL,
});

async function main() {
    const query = `
        ${EXPLAIN_ANALYZE}
        ${QUERY_TO_EXPLAIN}
    `;

    try {
        console.log('\n--- SQL QUERY ---\n');

        console.log(
            format(query, {
                language: 'postgresql',
                keywordCase: 'upper',
                indentStyle: 'standard',
            })
        );

        const result = await pool.query(query);

        console.log('\n--- QUERY PLAN ---\n');

        for (const row of result.rows) {
            console.log(row['QUERY PLAN']);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
