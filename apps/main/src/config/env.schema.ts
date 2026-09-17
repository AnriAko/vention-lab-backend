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

    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_STORAGE_BUCKET: z.string(),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string(),

    CLAMAV_ENABLED: z
        .string()
        .default('true')
        .transform((value) => value.toLowerCase() === 'true'),
    CLAMAV_HOST: z.string().default('localhost'),
    CLAMAV_PORT: z.coerce.number().default(3310),
    CLAMAV_TIMEOUT_MS: z.coerce.number().default(60_000),

    RAG_WS_URL: z.url(),
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

export type FirebaseConfig = {
    projectId: Env['FIREBASE_PROJECT_ID'];
    storageBucket: Env['FIREBASE_STORAGE_BUCKET'];
    serviceAccountPath: Env['FIREBASE_SERVICE_ACCOUNT_PATH'];
};

export type ClamAvConfig = {
    enabled: boolean;
    host: Env['CLAMAV_HOST'];
    port: Env['CLAMAV_PORT'];
    timeoutMs: Env['CLAMAV_TIMEOUT_MS'];
};

export type RagConfig = {
    wsUrl: Env['RAG_WS_URL'];
};
