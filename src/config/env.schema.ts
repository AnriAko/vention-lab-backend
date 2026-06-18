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
