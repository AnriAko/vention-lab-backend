import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { RedisModule } from '~/infrastructure/cache';
import { PrismaRlsInterceptor } from '~/common/tenancy';
import {
    LoggerInterceptor,
    ApiResponseInterceptor,
    HttpExceptionFilter,
    PrismaExceptionFilter,
} from '~/common/http';
import { AuthGuard, OrganizationGuard, RolesGuard } from '~/common/security';

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
            useClass: ThrottlerGuard,
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
