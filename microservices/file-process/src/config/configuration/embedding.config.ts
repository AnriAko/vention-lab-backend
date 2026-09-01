import { registerAs } from '@nestjs/config';

import { ConfigKeys } from '~/config/config.keys';

export const embeddingConfig = registerAs(ConfigKeys.EMBEDDING, () => ({
    batchSize: Number(process.env.OLLAMA_EMBEDDING_BATCH_SIZE ?? 32),
}));
