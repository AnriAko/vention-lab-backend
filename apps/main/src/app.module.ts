import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';

import { FirebaseModule } from '@vention/shared-firebase';
import { LoggerModule } from '@vention/shared-logger';
import { RabbitmqModule } from '@vention/shared-rabbitmq';

import { AUTH_GUEST } from '~/common/security/auth.types';
import { envFilePath } from '~/common/utils/env-file-path';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { configLoaders } from '~/config/config-loaders';
import { firebaseConfig } from '~/config/configuration/firebase.config';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { validateEnv } from '~/config/validate-env';
import { GlobalModule } from './common/global.module';
import { UsersModule } from '~/modules/user/user.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { HealthModule } from '~/modules/health/health.module';
import { AuthModule } from '~/modules/auth/auth.module';
import { OrganizationModule } from '~/modules/organization/organization.module';
import { MemberModule } from '~/modules/member/member.module';
import { LoggerMiddleware } from '~/common/http/middleware/logger.middleware';
import { UserStatsModule } from '~/modules/user-stats/user-stats.module';
import { SearchModule } from '~/modules/search/search.module';
import { FilesModule } from '~/modules/files/files.module';
import { ChatModule } from '~/modules/chat/chat.module';

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
        LoggerModule.forRoot({
            serviceName: 'main-service',
            enrich: () => {
                const ctx = requestContext.getStore();

                return {
                    requestId: ctx?.requestId ?? 'no-req',
                    userId: ctx?.userId ?? AUTH_GUEST,
                };
            },
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
        AuthModule,
        UsersModule,
        OrganizationModule,
        MemberModule,
        UserStatsModule,
        SearchModule,
        FilesModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            sortSchema: true,
            path: 'graphql',
            useGlobalPrefix: true,
            graphiql: true,
            playground: false,
            context: ({ req, res }) => ({ req, res }),
        }),
        ChatModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('/*path');
    }
}
