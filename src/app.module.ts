import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { configLoaders, validateEnv } from './config';
import { GlobalModule } from './common/global.module';
import { UsersModule } from '~/modules/user';
import { PrismaModule } from '~/infrastructure/database';
import { HealthModule } from '~/modules/health';
import { LoggerModule } from '~/infrastructure/logging';
import { envFilePath } from '~/common/utils';
import { AuthModule } from '~/modules/auth';
import { OrganizationModule } from '~/modules/organization';
import { MemberModule } from '~/modules/member';
import { LoggerMiddleware } from '~/common/http';
import { UserStatsModule } from '~/modules/user-stats';
import { SearchModule } from '~/modules/search';

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
        ThrottlerModule.forRoot([
            {
                name: 'default',
                ttl: 60 * 60 * 1000,
                limit: 200,
            },
        ]),
        PrismaModule,
        GlobalModule,
        HealthModule,
        LoggerModule,
        AuthModule,
        UsersModule,
        OrganizationModule,
        MemberModule,
        UserStatsModule,
        SearchModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('/*path');
    }
}
