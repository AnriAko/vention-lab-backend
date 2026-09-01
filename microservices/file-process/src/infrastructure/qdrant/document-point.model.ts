import { z } from 'zod';

export const DOCUMENTS_COLLECTION = 'documents';

export const DOCUMENTS_VECTOR_SIZE = 1024;

export const DOCUMENT_PAYLOAD_FIELDS = {
    ORGANIZATION_ID: 'organizationId',
    DOCUMENT_ID: 'documentId',
} as const;

export const documentPointPayloadSchema = z.object({
    organizationId: z.string().min(1),
    documentId: z.string().min(1),
    chunkId: z.string().min(1),
    fileName: z.string().min(1),
    text: z.string(),
});

export type DocumentPointPayload = z.infer<typeof documentPointPayloadSchema>;

export type DocumentPoint = {
    id: string;
    vector: number[];
    payload: DocumentPointPayload;
};

export function parseDocumentPointPayload(payload: unknown) {
    return documentPointPayloadSchema.safeParse(payload);
}
