import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
    ParsedDocument,
    ParsedSection,
} from '../parsing/parsed-document.types';
import type {
    ChunkingOptions,
    ChunkingStrategy,
    DocumentChunk,
} from './chunking.types';
import { splitTextWithOverlap } from './utils/split-text';
import { validateChunkingOptions } from './utils/validate-chunking-options';

@Injectable()
export class MarkdownChunkingStrategy implements ChunkingStrategy {
    chunk(document: ParsedDocument, options: ChunkingOptions): DocumentChunk[] {
        validateChunkingOptions(options);

        const sections =
            document.sections.length > 0
                ? document.sections
                : [{ text: document.text }];

        const chunks: DocumentChunk[] = [];

        for (const section of sections) {
            chunks.push(...this.chunkSection(section, options));
        }

        return chunks;
    }

    private chunkSection(
        section: ParsedSection,
        options: ChunkingOptions
    ): DocumentChunk[] {
        const sectionText = this.buildSectionText(section);

        if (!sectionText) {
            return [];
        }

        const parts = splitTextWithOverlap(
            sectionText,
            options.maxChunkSize,
            options.overlap
        );

        return parts.map((text) => ({
            chunkId: randomUUID(),
            text,
            metadata: {
                section: section.heading,
                sectionLevel: section.level,
            },
        }));
    }

    private buildSectionText(section: ParsedSection): string {
        if (section.heading) {
            const prefix = `${'#'.repeat(section.level ?? 1)} ${section.heading}`;

            return section.text ? `${prefix}\n\n${section.text}` : prefix;
        }

        return section.text.trim();
    }
}
