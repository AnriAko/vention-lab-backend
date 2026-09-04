import { registerAs } from '@nestjs/config';

import { ConfigKeys } from '~/config/config.keys';

export const rabbitmqConfig = registerAs(ConfigKeys.RABBITMQ, () => ({
    host: process.env.RABBITMQ_HOST,
    port: Number(process.env.RABBITMQ_PORT),
    user: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD,
}));
