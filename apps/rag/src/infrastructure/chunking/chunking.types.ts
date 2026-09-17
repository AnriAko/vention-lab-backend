import type { ParsedDocument } from '../parsing/parsed-document.types';

export const CHUNKING_STRATEGY = {
    FIXED_SIZE: 'fixed-size',
    MARKDOWN: 'markdown',
} as const;

export type ChunkingStrategyName =
    (typeof CHUNKING_STRATEGY)[keyof typeof CHUNKING_STRATEGY];

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
