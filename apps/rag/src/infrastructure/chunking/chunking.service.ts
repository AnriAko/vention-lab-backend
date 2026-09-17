import { Injectable } from '@nestjs/common';

import type { ParsedDocument } from '../parsing/parsed-document.types';
import type {
    ChunkingOptions,
    ChunkingStrategyName,
    DocumentChunk,
} from './chunking.types';
import { FixedSizeChunkingStrategy } from './fixed-size-chunking.strategy';
import { MarkdownChunkingStrategy } from './markdown-chunking.strategy';

@Injectable()
export class ChunkingService {
    constructor(
        private readonly fixedSizeChunkingStrategy: FixedSizeChunkingStrategy,
        private readonly markdownChunkingStrategy: MarkdownChunkingStrategy
    ) {}

    chunk(document: ParsedDocument, options: ChunkingOptions): DocumentChunk[] {
        return this.resolveStrategy(options.strategy).chunk(document, options);
    }

    private resolveStrategy(strategy: ChunkingStrategyName) {
        switch (strategy) {
            case 'fixed-size':
                return this.fixedSizeChunkingStrategy;
            case 'markdown':
                return this.markdownChunkingStrategy;
            default: {
                const exhaustive: never = strategy;
                throw new Error(`Unsupported chunking strategy: ${exhaustive}`);
            }
        }
    }
}
