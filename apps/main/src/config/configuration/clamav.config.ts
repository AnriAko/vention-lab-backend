import { registerAs } from '@nestjs/config';
import { ConfigKeys } from '~/config/config.keys';

export const clamavConfig = registerAs(ConfigKeys.CLAMAV, () => ({
    enabled: (process.env.CLAMAV_ENABLED ?? 'true').toLowerCase() === 'true',
    host: process.env.CLAMAV_HOST ?? 'localhost',
    port: parseInt(process.env.CLAMAV_PORT ?? '3310', 10),
    timeoutMs: parseInt(process.env.CLAMAV_TIMEOUT_MS ?? '60000', 10),
}));
