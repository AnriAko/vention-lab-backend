import type { Env } from './env.schema';
import { envSchema } from './env.schema';

/**
 * validateEnv
 * Purpose: Validate and coerce process environment using Zod schema.
 * - Called by `ConfigModule.forRoot({ validate })` to ensure the app
 *   starts with validated, typed environment values.
 * - Returns the parsed `Env` object (with coercions applied).
 */
export function validateEnv(raw: Record<string, unknown>): Env {
    return envSchema.parse(raw);
}

export default validateEnv;
