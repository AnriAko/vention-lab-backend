import { Global, Module } from '@nestjs/common';
import { PrismaRlsClient } from '~/common/tenancy/rls/prisma-rls.client';
import { PrismaRlsInterceptor } from '~/common/tenancy/rls/prisma-rls.interceptor';
import { PrismaRlsService } from '~/common/tenancy/rls/prisma-rls.service';
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
