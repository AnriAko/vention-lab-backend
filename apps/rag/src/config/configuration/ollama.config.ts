import { registerAs } from '@nestjs/config';

import { ConfigKeys } from '~/config/config.keys';

export const ollamaConfig = registerAs(ConfigKeys.OLLAMA, () => ({
    host: process.env.OLLAMA_HOST!,
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL!,
}));
