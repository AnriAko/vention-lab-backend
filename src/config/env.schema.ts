import type { StringValue } from 'ms';
import { z } from 'zod';

export const envSchema = z.object({
    PORT: z.coerce.number(),

    DATABASE_URL: z.string(),

    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),

    RABBITMQ_HOST: z.string(),
    RABBITMQ_PORT: z.coerce.number(),
    RABBITMQ_USER: z.string(),
    RABBITMQ_PASSWORD: z.string(),

    JWT_SECRET: z.string(),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1),

    ARGON2_PASSWORD_MEMORY_COST: z.coerce.number().default(65536), // 2 ** 16
    ARGON2_PASSWORD_TIME_COST: z.coerce.number().default(3),
    ARGON2_PASSWORD_PARALLELISM: z.coerce.number().default(1),

    ARGON2_TOKEN_MEMORY_COST: z.coerce.number().default(16384), // 2 ** 14
    ARGON2_TOKEN_TIME_COST: z.coerce.number().default(2),
    ARGON2_TOKEN_PARALLELISM: z.coerce.number().default(1),
});

export type Env = z.infer<typeof envSchema>;

export type AppConfig = {
    port: Env['PORT'];
};

export type DatabaseConfig = {
    url: Env['DATABASE_URL'];
};

export type RedisConfig = {
    host: Env['REDIS_HOST'];
    port: Env['REDIS_PORT'];
};

export type RabbitMQConfig = {
    host: Env['RABBITMQ_HOST'];
    port: Env['RABBITMQ_PORT'];
    user: Env['RABBITMQ_USER'];
    password: Env['RABBITMQ_PASSWORD'];
};

export type JwtConfig = {
    secret: Env['JWT_SECRET'];
    accessExpiresIn: StringValue;
    refreshExpiresIn: StringValue;
};
export type Argon2Config = {
    password: {
        memoryCost: number;
        timeCost: number;
        parallelism: number;
    };
    token: {
        memoryCost: number;
        timeCost: number;
        parallelism: number;
    };
};
