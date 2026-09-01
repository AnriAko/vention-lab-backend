export const ConfigKeys = {
    RABBITMQ: 'rabbitmq',
    FIREBASE: 'firebase',
    QDRANT: 'qdrant',
    CHUNKING: 'chunking',
    EMBEDDING: 'embedding',
    OLLAMA: 'ollama',
} as const;

export type ConfigKey = (typeof ConfigKeys)[keyof typeof ConfigKeys];
