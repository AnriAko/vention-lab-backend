export const getFileExtension = (storageKey: string): string | null => {
    const withoutGzip = storageKey.endsWith('.gz')
        ? storageKey.slice(0, -3)
        : storageKey;

    const extension = withoutGzip.split('.').pop()?.toLowerCase();

    return extension || null;
};
