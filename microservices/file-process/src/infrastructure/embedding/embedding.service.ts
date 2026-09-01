import { Inject, Injectable } from '@nestjs/common';

import { DOCUMENTS_VECTOR_SIZE } from '~/infrastructure/qdrant/document-point.model';

import { InvalidEmbeddingDimensionError } from './embedding.errors';
import {
    EMBEDDING_PROVIDER,
    type EmbeddingProvider,
} from './embedding.provider';

@Injectable()
export class EmbeddingService {
    constructor(
        @Inject(EMBEDDING_PROVIDER)
        private readonly provider: EmbeddingProvider
    ) {}

    async embed(text: string): Promise<number[]> {
        const vector = await this.provider.embed(text);
        this.validateDimension(vector);

        return vector;
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        const vectors = await this.provider.embedBatch(texts);

        for (const vector of vectors) {
            this.validateDimension(vector);
        }

        return vectors;
    }

    private validateDimension(vector: number[]): void {
        const actual = vector?.length ?? 0;

        if (actual === 0) {
            throw new InvalidEmbeddingDimensionError(DOCUMENTS_VECTOR_SIZE, 0);
        }

        if (actual !== DOCUMENTS_VECTOR_SIZE) {
            throw new InvalidEmbeddingDimensionError(
                DOCUMENTS_VECTOR_SIZE,
                actual
            );
        }
    }
}
