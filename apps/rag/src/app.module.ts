import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';

import { envFilePath } from '~/common/utils/env-file-path';
import { configLoaders } from '~/config/config-loaders';
import { firebaseConfig } from '~/config/configuration/firebase.config';
import { qdrantConfig } from '~/config/configuration/qdrant.config';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { validateEnv } from '~/config/validate-env';
import { AiDocumentModule } from '~/modules/ai-document/ai-document.module';
import { GenerationModule } from '~/modules/generation/generation.module';
import { FirebaseModule } from '@vention/shared-firebase';
import { LoggerModule } from '@vention/shared-logger';
import { QdrantModule } from '@vention/shared-qdrant';
import { RabbitmqModule } from '@vention/shared-rabbitmq';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath,
            validate: validateEnv,
            load: configLoaders,
        }),
        LoggerModule.forRoot({
            serviceName: 'rag',
        }),
        RabbitmqModule.forRootAsync({
            inject: [rabbitmqConfig.KEY],
            useFactory: (config: ConfigType<typeof rabbitmqConfig>) => ({
                host: config.host!,
                port: config.port,
                user: config.user!,
                password: config.password!,
            }),
        }),
        FirebaseModule.forRootAsync({
            inject: [firebaseConfig.KEY],
            useFactory: (config: ConfigType<typeof firebaseConfig>) => ({
                projectId: config.projectId!,
                storageBucket: config.storageBucket!,
                serviceAccountPath: config.serviceAccountPath!,
            }),
        }),
        QdrantModule.forRootAsync({
            inject: [qdrantConfig.KEY],
            useFactory: (config: ConfigType<typeof qdrantConfig>) => ({
                url: config.url,
                apiKey: config.apiKey,
            }),
        }),
        AiDocumentModule,
        GenerationModule,
    ],
})
export class AppModule {}
