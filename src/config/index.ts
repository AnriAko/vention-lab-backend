import { appConfig } from './configuration/app.config';
import { databaseConfig } from './configuration/database.config';
import { redisConfig } from './configuration/redis.config';
import { rabbitmqConfig } from './configuration/rabbitmq.config';
import validateEnv from './validate-env';
import type {
    envSchema,
    Env,
    AppConfig,
    DatabaseConfig,
    RedisConfig,
    RabbitMQConfig,
} from './env.schema';

export const configLoaders = [
    appConfig,
    databaseConfig,
    redisConfig,
    rabbitmqConfig,
];

export { appConfig, databaseConfig, redisConfig, rabbitmqConfig };
export { validateEnv };
export { envSchema };
export type { Env, AppConfig, DatabaseConfig, RedisConfig, RabbitMQConfig };

export default {
    configLoaders,
    validateEnv,
};
