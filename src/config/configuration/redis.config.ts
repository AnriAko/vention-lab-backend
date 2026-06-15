import { registerAs } from '@nestjs/config';
//REVIEW - what exact variables it needs and why

export const redisConfig = registerAs('redis', () => ({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}));
