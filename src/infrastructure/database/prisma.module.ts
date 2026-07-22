import { Global, Module } from '@nestjs/common';
import {
    PrismaRlsClient,
    PrismaRlsInterceptor,
    PrismaRlsService,
} from '~/common/tenancy';
import { PrismaService } from '~/infrastructure/database/prisma.service';

@Global()
@Module({
    providers: [
        PrismaService,
        PrismaRlsService,
        PrismaRlsClient,
        PrismaRlsInterceptor,
    ],
    exports: [
        PrismaService,
        PrismaRlsService,
        PrismaRlsClient,
        PrismaRlsInterceptor,
    ],
})
export class PrismaModule {}
