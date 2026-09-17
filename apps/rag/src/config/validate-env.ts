import type { Env } from './env.schema';
import { envSchema } from './env.schema';

export function validateEnv(raw: Record<string, unknown>): Env {
    return envSchema.parse(raw);
}
