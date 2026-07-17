import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { PrismaRlsInterceptor } from '~/infrastructure/database/prisma-rls.interceptor';
import { LoggerInterceptor } from '~/infrastructure/logging/logger.interceptor';
import { ApiResponseInterceptor } from '~/providers/interceptors/api-response.interceptor';
import { HttpExceptionFilter } from '~/providers/filters/http-exception.filter';
import { PrismaExceptionFilter } from '~/providers/filters/prisma-exception.filter';
import { AuthGuard } from '~/providers/guards/auth.guard';
import { OrganizationGuard } from '~/providers/guards/organization.guard';
import { RolesGuard } from '~/providers/guards/roles.guard';

/**
 * Global cross-cutting providers.
 *
 * Interceptor order (outer → inner):
 * ApiResponse → ZodSerializer → Logger → PrismaRls → handler
 *
 * Response path (inner → outer):
 * handler → PrismaRls → Logger → ZodSerializer (whitelist) → ApiResponse (envelope)
 */
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
