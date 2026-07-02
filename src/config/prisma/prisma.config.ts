import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const envFile =
    process.env.NODE_ENV === 'production'
        ? '.env.production.local'
        : '.env.development.local';

dotenv.config({
    path: path.resolve(process.cwd(), envFile),
});

export default defineConfig({
    schema: path.resolve(process.cwd(), 'prisma/schema.prisma'),
    migrations: {
        path: path.resolve(process.cwd(), 'prisma/migrations'),
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL!,
    },
});
