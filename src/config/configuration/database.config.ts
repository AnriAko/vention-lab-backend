import { registerAs } from '@nestjs/config';
import { ConfigKeys } from '~/config/config.keys';

export const databaseConfig = registerAs(ConfigKeys.DATABASE, () => ({
    url: process.env.DATABASE_URL!,
}));
