export function getPayloadString(payload: unknown, key: string): string {
    if (typeof payload !== 'object' || payload === null || !(key in payload)) {
        return '';
    }

    const value = (payload as Record<string, unknown>)[key];

    return typeof value === 'string' ? value : '';
}
