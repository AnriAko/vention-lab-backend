import { registerAs } from '@nestjs/config';
//TODO - add auth separate config

export const appConfig = registerAs('app', () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
}));
