export function toDenseVector(vector: unknown): number[] {
    if (
        Array.isArray(vector) &&
        vector.every((value) => typeof value === 'number')
    ) {
        return vector;
    }

    return [];
}
