import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { ParsedDocument } from '../parsing/markdown/markdown-parser.types';
import type {
    ChunkingOptions,
    ChunkingStrategy,
    DocumentChunk,
} from './chunking.types';
import { splitTextWithOverlap } from './utils/split-text';
import { validateChunkingOptions } from './utils/validate-chunking-options';

@Injectable()
export class FixedSizeChunkingStrategy implements ChunkingStrategy {
    chunk(document: ParsedDocument, options: ChunkingOptions): DocumentChunk[] {
        validateChunkingOptions(options);

        const parts = splitTextWithOverlap(
            document.text,
            options.maxChunkSize,
            options.overlap
        );

        return parts.map((text) => ({
            chunkId: randomUUID(),
            text,
            metadata: {},
        }));
    }
}
