import { Global, Module } from '@nestjs/common';
import { PrismaRlsClient } from '~/infrastructure/database/prisma-rls.client';
import { PrismaRlsInterceptor } from '~/infrastructure/database/prisma-rls.interceptor';
import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';
import { PrismaService } from '~/infrastructure/database/prisma.service';

/**
 * Single registration of PrismaService for the whole app.
 * Feature modules may import PrismaModule; Nest reuses this module instance
 * so PrismaService stays a singleton.
 */
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
