import { registerAs } from '@nestjs/config';

import { ConfigKeys } from '~/config/config.keys';

export const qdrantConfig = registerAs(ConfigKeys.QDRANT, () => ({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
}));
