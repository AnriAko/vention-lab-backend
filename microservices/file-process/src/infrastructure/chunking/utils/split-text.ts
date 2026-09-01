export function splitTextWithOverlap(
    text: string,
    maxChunkSize: number,
    overlap: number
): string[] {
    const normalized = text.trim();

    if (!normalized) {
        return [];
    }

    if (normalized.length <= maxChunkSize) {
        return [normalized];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
        const end = Math.min(start + maxChunkSize, normalized.length);
        chunks.push(normalized.slice(start, end));

        if (end >= normalized.length) {
            break;
        }

        const nextStart = end - overlap;

        if (nextStart <= start) {
            start = end;
            continue;
        }

        start = nextStart;
    }

    return chunks;
}
