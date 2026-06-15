import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from '~/app.service';
import { configLoaders, validateEnv } from './config';
import { GlobalModule } from './shared/global.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: configLoaders,
            expandVariables: true,
            cache: true,
            validate: validateEnv,
        }),
        GlobalModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
