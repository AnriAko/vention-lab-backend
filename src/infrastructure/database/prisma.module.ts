import { Module } from '@nestjs/common';
import { PrismaRlsService } from '~/infrastructure/database/prisma-rls.service';
import { PrismaService } from '~/infrastructure/database/prisma.service';

@Module({
    providers: [PrismaService, PrismaRlsService],
    exports: [PrismaService, PrismaRlsService],
})
export class PrismaModule {}
