import { existsSync } from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

function resolveEnvFile(): string {
    const envFile =
        process.env.NODE_ENV === 'production'
            ? '.env.production.local'
            : '.env.development.local';

    const candidates = [
        path.resolve(process.cwd(), envFile),
        path.resolve(process.cwd(), '../../', envFile),
    ];

    return (
        candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]
    );
}

export function loadPrismaEnv() {
    dotenv.config({
        path: resolveEnvFile(),
    });

    return {
        DATABASE_URL: process.env.DATABASE_URL!,
    };
}
