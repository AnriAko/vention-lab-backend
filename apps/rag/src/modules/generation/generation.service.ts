import { Inject, Injectable } from '@nestjs/common';

import {
    GENERATION_PROVIDER,
    type GenerationMessage,
    type GenerationOptions,
    type GenerationProvider,
} from './generation.provider';
import { EmbeddingService } from '~/infrastructure/embedding/embedding.service';
import { QdrantDocumentsService } from '~/infrastructure/qdrant/qdrant-documents.service';

@Injectable()
export class GenerationService {
    constructor(
        @Inject(GENERATION_PROVIDER)
        private readonly provider: GenerationProvider,
        private readonly embeddingService: EmbeddingService,
        private readonly qdrantDocumentsService: QdrantDocumentsService
    ) {}

    async *generate(
        generationId: string,
        query: string,
        organizationId: string,
        history: GenerationMessage[] = [],
        options?: GenerationOptions
    ): AsyncIterable<string> {
        const queryVector = await this.embeddingService.embed(query);

        const searchResults = await this.qdrantDocumentsService.search(
            queryVector,
            organizationId
        );

        const context = searchResults
            .map((result) => `[${result.fileName}]\n${result.text}`)
            .join('\n\n');

        const messages: GenerationMessage[] = [
            {
                role: 'system',
                content: [
                    'Answer the user using the provided context.',
                    'If the answer cannot be found in the context, say that you do not have enough information.',
                    '',
                    'Context:',
                    context || 'No relevant context found.',
                ].join('\n'),
            },
            ...history,
            {
                role: 'user',
                content: query,
            },
        ];

        yield* this.provider.generate({
            generationId,
            messages,
            options,
        });
    }

    cancel(generationId: string): void {
        this.provider.cancel(generationId);
    }
}
