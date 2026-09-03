import type { ParsedDocument } from '../parsing/markdown/markdown-parser.types';

export type ChunkingStrategyName = 'fixed-size' | 'markdown';

export type ChunkingOptions = {
    strategy: ChunkingStrategyName;
    maxChunkSize: number;
    overlap: number;
};

export type ChunkMetadata = {
    section?: string;
    sectionLevel?: number;
};

export type DocumentChunk = {
    chunkId: string;
    text: string;
    metadata: ChunkMetadata;
};

export interface ChunkingStrategy {
    chunk(document: ParsedDocument, options: ChunkingOptions): DocumentChunk[];
}
