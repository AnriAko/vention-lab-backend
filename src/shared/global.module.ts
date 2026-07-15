import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';

import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { LoggerInterceptor } from '~/infrastructure/logging/logger.interceptor';
import { HttpExceptionFilter } from '~/providers/filters/http-exception.filter';
import { PrismaExceptionFilter } from '~/providers/filters/prisma-exception.filter';
import { AuthGuard } from '~/providers/guards/auth.guard';
import { OrganizationGuard } from '~/providers/guards/organization.guard';
import { RolesGuard } from '~/providers/guards/roles.guard';

@Module({
    providers: [
        // 1. Validation layer
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },

        // 2. Response serialization
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },

        // 3. Logging
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggerInterceptor,
        },

        // 4. HTTP exceptions
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },

        // 5. Prisma exceptions
        {
            provide: APP_FILTER,
            useClass: PrismaExceptionFilter,
        },

        // 6. Auth guard
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },

        // 7. Organization guard (after auth context exists)
        {
            provide: APP_GUARD,
            useClass: OrganizationGuard,
        },

        // 8. Roles guard
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    imports: [RedisModule, PrismaModule],
})
export class GlobalModule {}
