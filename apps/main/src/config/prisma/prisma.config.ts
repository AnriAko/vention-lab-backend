import { existsSync } from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const appRoot = path.resolve(__dirname, '../../..');

const envFile =
    process.env.NODE_ENV === 'production'
        ? '.env.production.local'
        : '.env.development.local';

const envCandidates = [
    path.resolve(process.cwd(), envFile),
    path.resolve(appRoot, envFile),
    path.resolve(appRoot, '../../', envFile),
];

dotenv.config({
    path:
        envCandidates.find((candidate) => existsSync(candidate)) ??
        envCandidates[0],
});

export default defineConfig({
    schema: path.resolve(appRoot, 'prisma/schema.prisma'),
    migrations: {
        path: path.resolve(appRoot, 'prisma/migrations'),
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL!,
    },
});
