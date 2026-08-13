import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

import { RabbitmqModule } from '~/rabbitmq/rabbitmq.module';
import { FileProcessModule } from '~/file-process/file-process.module';

const envSchema = z.object({
    RABBITMQ_HOST: z.string(),
    RABBITMQ_PORT: z.coerce.number().default(5672),
    RABBITMQ_USER: z.string(),
    RABBITMQ_PASSWORD: z.string(),
    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_STORAGE_BUCKET: z.string(),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string(),
});

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                '.env.development.local',
                '.env.production.local',
                '../../.env.development.local',
                '../../.env.production.local',
            ],
            validate: (config) => {
                const parsed = envSchema.safeParse(config);
                if (!parsed.success) {
                    throw new Error(parsed.error.message);
                }
                return parsed.data;
            },
        }),
        RabbitmqModule,
        FileProcessModule,
    ],
})
export class AppModule {}
