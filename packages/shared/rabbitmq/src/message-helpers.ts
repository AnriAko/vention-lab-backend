import type { ConsumeMessage } from 'amqplib';

type MessageHeaders = Record<string, unknown>;

function getHeaders(
    headers: ConsumeMessage['properties']['headers']
): MessageHeaders {
    if (!headers || typeof headers !== 'object') {
        return {};
    }

    return headers;
}

export function getCorrelationId(
    message: ConsumeMessage,
    fallback: string
): string {
    const correlationId: unknown = message.properties.correlationId;

    return typeof correlationId === 'string' && correlationId.length > 0
        ? correlationId
        : fallback;
}

export function copyHeaders(
    headers: ConsumeMessage['properties']['headers']
): MessageHeaders {
    return { ...getHeaders(headers) };
}

export function getRetryCount(message: ConsumeMessage, header: string): number {
    const headers = getHeaders(message.properties.headers);
    const raw = headers[header];

    const value = typeof raw === 'number' ? raw : Number(raw);

    return Number.isFinite(value) && value > 0 ? value : 0;
}
