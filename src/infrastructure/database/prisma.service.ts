import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

//FIXME - find a proper input and way how to fix prisma and work with it https://www.prisma.io/docs/guides/frameworks/nestjs

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
    async onModuleDestroy() {
        await this.$disconnect();
    }
}
