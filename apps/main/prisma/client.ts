import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { loadPrismaEnv } from '../src/config/prisma/prisma-env';

const { DATABASE_URL } = loadPrismaEnv();

const pool = new Pool({
    connectionString: DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
} as any);

export async function disconnect() {
    await prisma.$disconnect();
    await pool.end();
}
