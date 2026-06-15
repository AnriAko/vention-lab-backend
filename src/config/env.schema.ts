import { z } from 'zod';
//TODO - add auth env here too
export const envSchema = z.object({
    PORT: z.coerce.number(),

    DB_HOST: z.string(),
    DB_PORT: z.coerce.number(),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),

    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),

    RABBITMQ_HOST: z.string(),
    RABBITMQ_PORT: z.coerce.number(),
    RABBITMQ_USER: z.string(),
    RABBITMQ_PASSWORD: z.string(),
});
//REVIEW - check how types gonna fit inside modules
//TODO - add auth env later for all
export type Env = z.infer<typeof envSchema>;

export type AppConfig = {
    port: Env['PORT'];
};

export type DatabaseConfig = {
    host: Env['DB_HOST'];
    port: Env['DB_PORT'];
    name: Env['DB_NAME'];
    user: Env['DB_USER'];
    password: Env['DB_PASSWORD'];
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
