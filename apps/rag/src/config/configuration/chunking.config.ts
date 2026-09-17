import { registerAs } from '@nestjs/config';

import { ConfigKeys } from '~/config/config.keys';
import type { ChunkingStrategyName } from '~/infrastructure/chunking/chunking.types';

const chunkingStrategySchema = ['fixed-size', 'markdown'] as const;

function parseChunkingStrategy(
    value: string | undefined
): ChunkingStrategyName {
    if (
        value &&
        chunkingStrategySchema.includes(value as ChunkingStrategyName)
    ) {
        return value as ChunkingStrategyName;
    }

    return 'markdown';
}

export const chunkingConfig = registerAs(ConfigKeys.CHUNKING, () => ({
    strategy: parseChunkingStrategy(process.env.CHUNKING_STRATEGY),
    maxChunkSize: Number(process.env.CHUNKING_MAX_CHUNK_SIZE ?? 1000),
    overlap: Number(process.env.CHUNKING_OVERLAP ?? 150),
}));
