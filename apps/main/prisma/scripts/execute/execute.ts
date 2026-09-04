import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { loadPrismaEnv } from '../../../src/config/prisma/prisma-env';
import { QUERY_TO_EXECUTE } from './query-to-execute';
import { PrismaClient } from '../../../src/generated/prisma/client';

const { DATABASE_URL } = loadPrismaEnv();

const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    try {
        console.log('\n--- SQL QUERY RESULT ---\n');

        const result = await prisma.$queryRaw(QUERY_TO_EXECUTE);

        console.dir(result, {
            depth: null,
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
