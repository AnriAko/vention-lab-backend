import { registerAs } from '@nestjs/config';
import { ConfigKeys } from '~/config/config.keys';
import type { Argon2Config } from '~/config/env.schema';

export const argon2Config = registerAs(
    ConfigKeys.ARGON2,
    (): Argon2Config => ({
        password: {
            memoryCost: Number(process.env.ARGON2_PASSWORD_MEMORY_COST),
            timeCost: Number(process.env.ARGON2_PASSWORD_TIME_COST),
            parallelism: Number(process.env.ARGON2_PASSWORD_PARALLELISM),
        },
        token: {
            memoryCost: Number(process.env.ARGON2_TOKEN_MEMORY_COST),
            timeCost: Number(process.env.ARGON2_TOKEN_TIME_COST),
            parallelism: Number(process.env.ARGON2_TOKEN_PARALLELISM),
        },
    })
);
