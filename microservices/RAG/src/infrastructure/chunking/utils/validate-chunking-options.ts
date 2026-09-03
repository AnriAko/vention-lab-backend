import type { ChunkingOptions } from '../chunking.types';
import { InvalidChunkingOptionsError } from '../chunking.errors';

export function validateChunkingOptions(options: ChunkingOptions): void {
    if (options.maxChunkSize <= 0) {
        throw new InvalidChunkingOptionsError(
            'maxChunkSize must be greater than 0'
        );
    }

    if (options.overlap < 0) {
        throw new InvalidChunkingOptionsError(
            'overlap must be greater than or equal to 0'
        );
    }

    if (options.overlap >= options.maxChunkSize) {
        throw new InvalidChunkingOptionsError(
            'overlap must be less than maxChunkSize'
        );
    }
}
