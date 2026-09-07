import { Controller, Get, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import {
    HealthCheckService,
    HealthCheck,
    type HealthIndicatorResult,
    type HealthIndicatorStatus,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { firstValueFrom, timeout } from 'rxjs';
import { io } from 'socket.io-client';
import {
    GENERATION_WS_HEALTH_CHECK_EVENT,
    GENERATION_WS_NAMESPACE,
} from '@vention/generation-contract';
import {
    HEALTH_CHECK_PATTERN,
    type HealthCheckResult,
} from '@vention/health-contract';

import { ApiEndpoint } from '~/common/api/decorators/api-endpoint.decorator';
import { ApiResponse } from '~/common/api/response/response.decorator';
import { PublicRoute } from '~/common/security/decorators/public.decorator';
import { ClamAvService } from '~/infrastructure/antivirus/clamav.service';
import { PrismaService } from '~/infrastructure/database/prisma.service';
import { RedisService } from '~/infrastructure/cache/redis.service';
import { RabbitmqService } from '@vention/shared-rabbitmq';
import { ragConfig } from '~/config/configuration/rag.config';

import { HealthCheckResponse } from './responses/health-check.response';

const HEALTH_CHECK_TIMEOUT_MS = 10_000;

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
        private readonly clamAv: ClamAvService,
        @Inject('FILE_PROCESS_HEALTH_CLIENT')
        private readonly fileProcessHealth: ClientProxy,
        @Inject('RAG_HEALTH_CLIENT')
        private readonly ragHealth: ClientProxy,
        @Inject(ragConfig.KEY)
        private readonly rag: ConfigType<typeof ragConfig>
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
            () =>
                this.prismaIndicator.pingCheck('database', this.prisma, {
                    timeout: HEALTH_CHECK_TIMEOUT_MS,
                }),
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
            () => this.checkService(this.fileProcessHealth, 'file-process'),
            () => this.checkService(this.ragHealth, 'rag'),
            () => this.checkGenerationWebsocket(),
        ]);
    }

    private async checkService(
        client: ClientProxy,
        service: string
    ): Promise<HealthIndicatorResult> {
        try {
            const result = await firstValueFrom(
                client
                    .send<HealthCheckResult, Record<string, never>>(
                        HEALTH_CHECK_PATTERN,
                        {}
                    )
                    .pipe(timeout(HEALTH_CHECK_TIMEOUT_MS))
            );

            return {
                [service]: {
                    status: result.status === 'up' ? 'up' : 'down',
                },
            };
        } catch (error) {
            return {
                [service]: {
                    status: 'down',
                    message:
                        error instanceof Error ? error.message : String(error),
                },
            };
        }
    }

    private checkGenerationWebsocket(): Promise<HealthIndicatorResult> {
        return new Promise((resolve) => {
            const socket = io(`${this.rag.wsUrl}${GENERATION_WS_NAMESPACE}`, {
                transports: ['websocket'],
                timeout: HEALTH_CHECK_TIMEOUT_MS,
            });
            let settled = false;

            const finish = (
                status: HealthIndicatorStatus,
                message?: string
            ) => {
                if (settled) {
                    return;
                }

                settled = true;
                socket.disconnect();
                resolve({
                    generation: { status, ...(message && { message }) },
                });
            };

            socket.on('connect', () => {
                socket.emit(
                    GENERATION_WS_HEALTH_CHECK_EVENT,
                    {},
                    (result: HealthCheckResult) =>
                        finish(result?.status === 'up' ? 'up' : 'down')
                );
            });
            socket.on('connect_error', (error: Error) =>
                finish('down', error.message)
            );
            setTimeout(
                () => finish('down', 'Generation websocket timeout'),
                HEALTH_CHECK_TIMEOUT_MS
            );
        });
    }
}
