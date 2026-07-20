import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { ApiEndpoint } from '~/common/decorators/api-endpoint.decorator';
import { PublicRoute } from '~/common/decorators/public.decorator';
import { ApiResponse } from '~/common/dto/response-schema';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { RabbitmqService } from '~/infrastructure/messaging/rabbitmq.service';

import { HealthCheckResponse } from './responses/health-check.response';

@ApiTags('health')
@SkipThrottle()
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
    @ApiEndpoint({
        summary: 'Health check',
        guest: true,
        description:
            'Infrastructure probe for database, Redis, and RabbitMQ. No authentication.',
    })
    @ApiResponse(HealthCheckResponse)
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
