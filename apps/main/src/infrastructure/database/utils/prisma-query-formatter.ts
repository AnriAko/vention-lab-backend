export const formatPrismaQuery = (query: string, params: string): string => {
    let formatted = query;

    formatted = formatted.replace(/"public"\./g, '');
    formatted = formatted.replace(/"/g, '');

    try {
        const parsedParams = JSON.parse(params || '[]');

        parsedParams.forEach((p: unknown, i: number) => {
            const value = typeof p === 'string' ? `'${p}'` : String(p);

            formatted = formatted.replace(
                new RegExp(`\\$${i + 1}`, 'g'),
                value
            );
        });
    } catch (error) {
        console.error('Failed to format Prisma query parameters.', {
            params,
            error,
        });
    }

    return formatted;
};

export const getRawPrismaQuery = (query: string, params: string): string => {
    let sql = query;

    try {
        const parsedParams = JSON.parse(params || '[]');

        parsedParams.forEach((p: unknown, i: number) => {
            const value =
                typeof p === 'string'
                    ? `'${p.replace(/'/g, "''")}'`
                    : String(p);

            sql = sql.replace(new RegExp(`\\$${i + 1}\\b`, 'g'), value);
        });
    } catch (error) {
        console.error('Failed to parse Prisma query parameters.', {
            params,
            error,
        });
    }

    return sql.replace(/\s+/g, ' ').trim();
};
