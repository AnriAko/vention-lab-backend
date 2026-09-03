export const ConfigKeys = {
    RABBITMQ: 'rabbitmq',
    FIREBASE: 'firebase',
} as const;

export type ConfigKey = (typeof ConfigKeys)[keyof typeof ConfigKeys];
