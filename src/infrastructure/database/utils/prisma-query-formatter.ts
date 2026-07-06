export const formatPrismaQuery = (query: string, params: string): string => {
    let formatted = query;

    formatted = formatted.replace(/"public"\./g, '');

    formatted = formatted.replace(/"/g, '');

    try {
        const parsedParams = JSON.parse(params || '[]');

        parsedParams.forEach((p: any, i: number) => {
            const value = typeof p === 'string' ? `'${p}'` : String(p);

            formatted = formatted.replace(
                new RegExp(`\\$${i + 1}`, 'g'),
                value
            );
        });
    } catch {
        // ignore
    }

    return formatted;
};
