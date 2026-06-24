import { registerAs } from '@nestjs/config';
import { ConfigKeys } from '~/config/config.keys';

export const redisConfig = registerAs(ConfigKeys.REDIS, () => ({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}));
