import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { AntivirusModule } from '~/infrastructure/antivirus/antivirus.module';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
    imports: [TerminusModule, PrismaModule, RedisModule, AntivirusModule],
    controllers: [HealthController],
    providers: [PrismaHealthIndicator],
})
export class HealthModule {}
