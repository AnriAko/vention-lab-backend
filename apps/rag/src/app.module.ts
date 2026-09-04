import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';

import { envFilePath } from '~/common/utils/env-file-path';
import { configLoaders } from '~/config/config-loaders';
import { firebaseConfig } from '~/config/configuration/firebase.config';
import { qdrantConfig } from '~/config/configuration/qdrant.config';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { validateEnv } from '~/config/validate-env';
import { RagModule } from '~/modules/rag/rag.module';
import { FirebaseModule } from '~/shared/firebase';
import { LoggerModule } from '~/shared/logger';
import { QdrantModule } from '~/shared/qdrant';
import { RabbitmqModule } from '~/shared/rabbitmq';

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
        RagModule,
    ],
})
export class AppModule {}
