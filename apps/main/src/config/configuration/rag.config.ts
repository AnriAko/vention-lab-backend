import { registerAs } from '@nestjs/config';

import { ConfigKeys } from '~/config/config.keys';

export const ragConfig = registerAs(ConfigKeys.RAG, () => ({
    wsUrl: process.env.RAG_WS_URL!,
}));
