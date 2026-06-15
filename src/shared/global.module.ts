import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from '../providers/filters/http-exception.filter';
import { ZodSerializerInterceptor } from '../providers/interceptors/zod-serializer.interceptor';
import { ZodValidationPipe } from '../providers/pipes/zod-validation.pipe';
//FIXME - refactor shared folder and make it work with providers if need
//TODO - add guard for auth
//TODO - add guard for roles (user, admin)

@Module({
    providers: [
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
    exports: [],
})
export class GlobalModule {}
