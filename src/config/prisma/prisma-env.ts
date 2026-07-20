import path from 'path';
import dotenv from 'dotenv';

export function loadPrismaEnv() {
    const envFile =
        process.env.NODE_ENV === 'production'
            ? '.env.production.local'
            : '.env.development.local';

    dotenv.config({
        path: path.resolve(process.cwd(), envFile),
    });

    return {
        DATABASE_URL: process.env.DATABASE_URL!,
    };
}
