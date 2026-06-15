import { registerAs } from '@nestjs/config';
//REVIEW - what exact variables it needs and why
export const rabbitmqConfig = registerAs('rabbitmq', () => ({
    host: process.env.RABBITMQ_HOST,
    port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
    user: process.env.RABBITMQ_USER,
    password: process.env.RABBITMQ_PASSWORD,
}));
