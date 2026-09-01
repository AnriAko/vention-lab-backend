import { Injectable } from '@nestjs/common';

import { DOCUMENTS_VECTOR_SIZE } from '../qdrant/document-point.model';

@Injectable()
export class EmbeddingService {
    async embed(_text: string): Promise<number[]> {
        // TODO: implement real embedding provider
        return new Array(DOCUMENTS_VECTOR_SIZE).fill(0);
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        const vectors: number[][] = [];

        for (const text of texts) {
            vectors.push(await this.embed(text));
        }

        return vectors;
    }
}
