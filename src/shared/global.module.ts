import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { LoggerInterceptor } from '~/infrastructure/logging/logger.interceptor';
import { HttpExceptionFilter } from '~/providers/filters/http-exception.filter';
import { PrismaExceptionFilter } from '~/providers/filters/prisma-exception.filter';

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

        // 3. Logging (main interceptor)
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggerInterceptor,
        },

        // 4. HTTP exceptions (HttpException, BadRequest etc.)
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },

        // 5. Prisma DB exceptions (P2002, P2025 etc.)
        {
            provide: APP_FILTER,
            useClass: PrismaExceptionFilter,
        },
    ],
})
export class GlobalModule {}
