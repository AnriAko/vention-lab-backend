import { z } from 'zod';

export const envSchema = z
    .object({
        RABBITMQ_HOST: z.string(),
        RABBITMQ_PORT: z.coerce.number().default(5672),
        RABBITMQ_USER: z.string(),
        RABBITMQ_PASSWORD: z.string(),
        FIREBASE_PROJECT_ID: z.string(),
        FIREBASE_STORAGE_BUCKET: z.string(),
        FIREBASE_SERVICE_ACCOUNT_PATH: z.string(),

        QDRANT_URL: z.string(),
        QDRANT_API_KEY: z.string().optional(),

        CHUNKING_STRATEGY: z
            .enum(['fixed-size', 'markdown'])
            .default('markdown'),
        CHUNKING_MAX_CHUNK_SIZE: z.coerce
            .number()
            .int()
            .positive()
            .default(1000),
        CHUNKING_OVERLAP: z.coerce.number().int().nonnegative().default(150),

        EMBEDDING_BATCH_SIZE: z.coerce.number().int().positive().default(32),
    })
    .superRefine((env, ctx) => {
        if (env.CHUNKING_OVERLAP >= env.CHUNKING_MAX_CHUNK_SIZE) {
            ctx.addIssue({
                code: 'custom',
                message:
                    'CHUNKING_OVERLAP must be less than CHUNKING_MAX_CHUNK_SIZE',
                path: ['CHUNKING_OVERLAP'],
            });
        }
    });

export type Env = z.infer<typeof envSchema>;
