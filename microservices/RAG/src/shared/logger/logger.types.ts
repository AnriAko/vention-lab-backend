export type LoggerEnricher = () => Record<string, unknown>;

export type LoggerOptions = {
    serviceName: string;
    level?: string;
    enrich?: LoggerEnricher;
};

export const LOGGER_OPTIONS = 'LOGGER_OPTIONS';
