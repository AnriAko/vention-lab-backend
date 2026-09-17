export type DocumentSearchResult = {
    id: string;
    score: number;
    text: string;
    documentId: string;
    chunkId: string;
    fileName: string;
};
