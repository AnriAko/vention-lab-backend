import { z } from 'zod';

export const envSchema = z.object({
    RABBITMQ_HOST: z.string(),
    RABBITMQ_PORT: z.coerce.number().default(5672),
    RABBITMQ_USER: z.string(),
    RABBITMQ_PASSWORD: z.string(),
    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_STORAGE_BUCKET: z.string(),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string(),
});

export type Env = z.infer<typeof envSchema>;
