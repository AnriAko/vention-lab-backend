import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { ApiEndpoint } from '~/common/api/decorators/api-endpoint.decorator';
import { ApiResponse } from '~/common/api/response/response.decorator';
import { PublicRoute } from '~/common/security/decorators/public.decorator';
import { ClamAvService } from '~/infrastructure/antivirus/clamav.service';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { RabbitmqService } from '~/shared/rabbitmq';

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
        private readonly rabbitmq: RabbitmqService,
        private readonly clamAv: ClamAvService
    ) {}

    @Get()
    @HealthCheck()
    @ApiEndpoint({
        summary: 'Health check',
        guest: true,
        description:
            'Infrastructure probe for database, Redis, RabbitMQ, and antivirus (ClamAV). No authentication.',
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
            async () => {
                const antivirus = await this.clamAv.checkHealth();

                return {
                    antivirus: {
                        status: antivirus.status,
                        enabled: antivirus.enabled,
                        message: antivirus.message,
                    },
                };
            },
        ]);
    }
}
