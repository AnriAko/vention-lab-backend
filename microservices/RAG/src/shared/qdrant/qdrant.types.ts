export type QdrantOptions = {
    url?: string;
    apiKey?: string;
};

export const QDRANT_OPTIONS = 'QDRANT_OPTIONS';

export const QDRANT_DISTANCE = {
    COSINE: 'Cosine',
    EUCLID: 'Euclid',
    DOT: 'Dot',
    MANHATTAN: 'Manhattan',
} as const;

export type QdrantDistance =
    (typeof QDRANT_DISTANCE)[keyof typeof QDRANT_DISTANCE];

export type QdrantPoint = {
    id: string | number;
    vector: number[];
    payload?: Record<string, unknown>;
};

export type QdrantSearchHit = {
    id: string;
    vector: number[];
    payload: Record<string, unknown> | null;
    score?: number;
};
