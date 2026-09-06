export const ConfigKeys = {
    APP: 'app',
    ARGON2: 'argon2',
    CLAMAV: 'clamav',
    DATABASE: 'database',
    FIREBASE: 'firebase',
    JWT: 'jwt',
    RABBITMQ: 'rabbitmq',
    REDIS: 'redis',
    RAG: 'rag',
} as const;

export type ConfigKey = (typeof ConfigKeys)[keyof typeof ConfigKeys];
