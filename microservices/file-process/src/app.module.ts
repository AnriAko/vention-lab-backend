import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envFilePath } from '~/common/utils/env-file-path';
import { validateEnv } from '~/config/validate-env';
import { FileProcessModule } from '~/file-process/file-process.module';
import { RabbitmqModule } from '~/rabbitmq/rabbitmq.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath,
            validate: validateEnv,
        }),
        RabbitmqModule,
        FileProcessModule,
    ],
})
export class AppModule {}
