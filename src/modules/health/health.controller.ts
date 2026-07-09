import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { RabbitmqService } from '~/infrastructure/messaging/rabbitmq.service';
import { PublicRoute } from '~/common/decorators/public.decorator';

@PublicRoute()
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly prismaIndicator: PrismaHealthIndicator,
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly rabbitmq: RabbitmqService
    ) {}

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.prismaIndicator.pingCheck('database', this.prisma),
            async () => ({
                redis: {
                    status: (await this.redis.ping()) ? 'up' : 'down',
                },
            }),
            async () => ({
                rabbitmq: {
                    status: (await this.rabbitmq.checkConnection())
                        ? 'up'
                        : 'down',
                },
            }),
        ]);
    }
}
