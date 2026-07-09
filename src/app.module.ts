import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoaders, validateEnv } from './config';
import { GlobalModule } from './shared/global.module';
import { UsersModule } from '~/modules/user/user.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { HealthModule } from '~/modules/health/health.module';
import { LoggerModule } from '~/infrastructure/logging/logger.module';
import { envFilePath } from '~/common/utils/env-file-path';
import { AuthModule } from '~/modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { LoggerMiddleware } from '~/infrastructure/logging/logger.middleware';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath,
            load: configLoaders,
            expandVariables: true,
            cache: true,
            validate: validateEnv,
        }),
        GlobalModule,
        PrismaModule,
        HealthModule,
        LoggerModule,
        AuthModule,
        UsersModule,
        OrganizationModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('/*path');
    }
}
