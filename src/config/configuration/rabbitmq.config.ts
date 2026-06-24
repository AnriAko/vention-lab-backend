import { registerAs } from '@nestjs/config';
import { ConfigKeys } from '~/config/config.keys';

export const rabbitmqConfig = registerAs(ConfigKeys.RABBITMQ, () => ({
    host: process.env.RABBITMQ_HOST,
    port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
    user: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD,
}));
