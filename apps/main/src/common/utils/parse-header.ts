import type { Request } from 'express';

export function parseHeader(
    request: Request,
    headerName: string
): { type?: string; value?: string } | undefined {
    const header = request.headers[headerName.toLowerCase()];

    if (!header) return undefined;

    const raw = Array.isArray(header) ? header[0] : header;

    const [type, value] = raw.split(' ');

    return {
        type,
        value,
    };
}
