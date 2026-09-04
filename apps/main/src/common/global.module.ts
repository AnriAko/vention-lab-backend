import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { AppThrottlerGuard } from '~/common/security/guards/app-throttler.guard';

import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { PrismaRlsInterceptor } from '~/common/tenancy/rls/prisma-rls.interceptor';
import { LoggerInterceptor } from '~/common/http/interceptors/logger.interceptor';
import { ApiResponseInterceptor } from '~/common/http/interceptors/api-response.interceptor';
import { HttpExceptionFilter } from '~/common/http/filters/http-exception.filter';
import { PrismaExceptionFilter } from '~/common/http/filters/prisma-exception.filter';
import { AuthGuard } from '~/common/security/guards/auth.guard';
import { OrganizationGuard } from '~/common/security/guards/organization.guard';
import { RolesGuard } from '~/common/security/guards/roles.guard';

@Module({
    providers: [
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ApiResponseInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggerInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: PrismaRlsInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_FILTER,
            useClass: PrismaExceptionFilter,
        },
        {
            provide: APP_GUARD,
            useClass: AppThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: OrganizationGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    imports: [RedisModule],
})
export class GlobalModule {}
