import { Inject, Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

import {
    QDRANT_OPTIONS,
    type QdrantDistance,
    type QdrantOptions,
    type QdrantPoint,
    type QdrantSearchHit,
} from './qdrant.types';
import { toDenseVector } from './qdrant.utils';

@Injectable()
export class QdrantService {
    private readonly client: QdrantClient;

    constructor(
        @Inject(QDRANT_OPTIONS)
        private readonly options: QdrantOptions
    ) {
        this.client = new QdrantClient({
            url: this.options.url,
            apiKey: this.options.apiKey,
        });
    }

    async ensureCollection(
        collectionName: string,
        vectors: { size: number; distance: QdrantDistance }
    ): Promise<void> {
        const collections = await this.client.getCollections();
        const exists = collections.collections.some(
            ({ name }) => name === collectionName
        );

        if (exists) {
            return;
        }

        await this.client.createCollection(collectionName, {
            vectors: {
                size: vectors.size,
                distance: vectors.distance,
            },
        });
    }

    async ensurePayloadIndex(
        collectionName: string,
        fieldName: string,
        fieldSchema:
            'keyword' | 'integer' | 'float' | 'bool' | 'text' = 'keyword'
    ): Promise<void> {
        const collection = await this.client.getCollection(collectionName);
        const payloadSchema = collection.payload_schema ?? {};

        if (fieldName in payloadSchema) {
            return;
        }

        await this.client.createPayloadIndex(collectionName, {
            field_name: fieldName,
            field_schema: fieldSchema,
        });
    }

    async upsert(
        collectionName: string,
        points: QdrantPoint[],
        wait = true
    ): Promise<void> {
        if (points.length === 0) {
            return;
        }

        await this.client.upsert(collectionName, {
            wait,
            points: points.map((point) => ({
                id: point.id,
                vector: point.vector,
                payload: point.payload,
            })),
        });
    }

    async deleteByFilter(
        collectionName: string,
        filter: Record<string, unknown>,
        wait = true
    ): Promise<void> {
        await this.client.delete(collectionName, {
            wait,
            filter: filter,
        });
    }

    async search(
        collectionName: string,
        vector: number[],
        options: {
            limit: number;
            filter?: Record<string, unknown>;
        }
    ): Promise<QdrantSearchHit[]> {
        const result = await this.client.query(collectionName, {
            query: vector,
            limit: options.limit,
            filter: options.filter,
            with_payload: true,
            with_vector: true,
        });

        return result.points.map((point) => ({
            id: String(point.id),
            vector: toDenseVector(point.vector),
            payload: (point.payload as Record<string, unknown> | null) ?? null,
            score: point.score,
        }));
    }
}
