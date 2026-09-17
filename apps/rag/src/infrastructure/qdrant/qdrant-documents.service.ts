import { Injectable, OnModuleInit } from '@nestjs/common';

import { LoggerService } from '@vention/shared-logger';
import { QDRANT_DISTANCE, QdrantService } from '@vention/shared-qdrant';

import {
    DOCUMENT_PAYLOAD_FIELDS,
    DOCUMENTS_COLLECTION,
    DOCUMENTS_VECTOR_SIZE,
    type DocumentPoint,
} from './document-point.model';
import type { DocumentSearchResult } from './qdrant-documents.types';
import { getPayloadString } from '~/infrastructure/qdrant/qdrant-documents.utils';

const UPSERT_BATCH_SIZE = 100;

@Injectable()
export class QdrantDocumentsService implements OnModuleInit {
    constructor(
        private readonly qdrant: QdrantService,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.qdrant.ensureCollection(DOCUMENTS_COLLECTION, {
            size: DOCUMENTS_VECTOR_SIZE,
            distance: QDRANT_DISTANCE.COSINE,
        });

        await this.qdrant.ensurePayloadIndex(
            DOCUMENTS_COLLECTION,
            DOCUMENT_PAYLOAD_FIELDS.ORGANIZATION_ID
        );

        await this.qdrant.ensurePayloadIndex(
            DOCUMENTS_COLLECTION,
            DOCUMENT_PAYLOAD_FIELDS.DOCUMENT_ID
        );

        this.logger.log(`Qdrant collection "${DOCUMENTS_COLLECTION}" is ready`);
    }

    async insertBatch(points: DocumentPoint[]): Promise<void> {
        if (points.length === 0) {
            return;
        }

        for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
            const batch = points.slice(i, i + UPSERT_BATCH_SIZE);

            await this.qdrant.upsert(
                DOCUMENTS_COLLECTION,
                batch.map((point) => ({
                    id: point.id,
                    vector: point.vector,
                    payload: { ...point.payload },
                }))
            );
        }
    }

    async deleteByDocumentId(documentId: string): Promise<void> {
        await this.qdrant.deleteByFilter(DOCUMENTS_COLLECTION, {
            must: [
                {
                    key: DOCUMENT_PAYLOAD_FIELDS.DOCUMENT_ID,
                    match: { value: documentId },
                },
            ],
        });

        this.logger.log(
            `Deleted Qdrant points collection=${DOCUMENTS_COLLECTION} documentId=${documentId}`
        );
    }

    async search(
        vector: number[],
        organizationId: string,
        limit = 5
    ): Promise<DocumentSearchResult[]> {
        const results = await this.qdrant.search(DOCUMENTS_COLLECTION, vector, {
            limit,
            filter: {
                must: [
                    {
                        key: DOCUMENT_PAYLOAD_FIELDS.ORGANIZATION_ID,
                        match: {
                            value: organizationId,
                        },
                    },
                ],
            },
        });

        return results.map((result) => {
            const payload = result.payload;

            return {
                id: result.id,
                score: result.score ?? 0,
                text: getPayloadString(payload, 'text'),
                documentId: getPayloadString(payload, 'documentId'),
                chunkId: getPayloadString(payload, 'chunkId'),
                fileName: getPayloadString(payload, 'fileName'),
            };
        });
    }
}
