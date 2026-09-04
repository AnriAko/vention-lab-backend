import { registerAs } from '@nestjs/config';
import { ConfigKeys } from '~/config/config.keys';

export const appConfig = registerAs(ConfigKeys.APP, () => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
}));
