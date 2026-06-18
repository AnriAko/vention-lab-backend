import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { RabbitmqModule } from '~/infrastructure/messaging/rabbitmq.module';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from '~/modules/health/health.controller';

@Module({
    imports: [TerminusModule, PrismaModule, RedisModule, RabbitmqModule],
    controllers: [HealthController],
    providers: [PrismaHealthIndicator],
})
export class HealthModule {}
