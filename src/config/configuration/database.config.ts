import { registerAs } from '@nestjs/config';
//REVIEW - what exact variables it needs and why
//FIXME - Should be one URL
export const databaseConfig = registerAs('database', () => ({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
}));
