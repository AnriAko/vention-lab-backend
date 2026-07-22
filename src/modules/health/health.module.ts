import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '~/infrastructure/database';
import { RedisModule } from '~/infrastructure/cache';
import { RabbitmqModule } from '~/infrastructure/messaging';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
    imports: [TerminusModule, PrismaModule, RedisModule, RabbitmqModule],
    controllers: [HealthController],
    providers: [PrismaHealthIndicator],
})
export class HealthModule {}
