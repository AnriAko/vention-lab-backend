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
    } catch {}

    return formatted;
};

export const getRawPrismaQuery = (query: string, params: string): string => {
    let sql = query;

    try {
        const parsedParams = JSON.parse(params || '[]');

        parsedParams.forEach((p: any, i: number) => {
            let value: string;

            if (typeof p === 'string') {
                value = `'${p.replace(/'/g, "''")}'`;
            } else {
                value = String(p);
            }

            sql = sql.replace(new RegExp(`\\$${i + 1}\\b`, 'g'), value);
        });
    } catch {}

    return sql;
};
