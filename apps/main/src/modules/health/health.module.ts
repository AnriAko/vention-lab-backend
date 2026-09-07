import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { ConfigType } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaModule } from '~/infrastructure/database/prisma.module';
import { RedisModule } from '~/infrastructure/cache/redis.module';
import { AntivirusModule } from '~/infrastructure/antivirus/antivirus.module';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { HealthController } from './health.controller';

const FILE_PROCESS_HEALTH_QUEUE = 'file.process.health.queue';
const RAG_HEALTH_QUEUE = 'ai.document.health.queue';

@Module({
    imports: [
        TerminusModule,
        PrismaModule,
        RedisModule,
        AntivirusModule,
        ClientsModule.registerAsync([
            {
                name: 'FILE_PROCESS_HEALTH_CLIENT',
                inject: [rabbitmqConfig.KEY],
                useFactory: (config: ConfigType<typeof rabbitmqConfig>) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${config.user}:${config.password}@${config.host}:${config.port}`,
                        ],
                        queue: FILE_PROCESS_HEALTH_QUEUE,
                        queueOptions: {
                            durable: true,
                        },
                    },
                }),
            },
            {
                name: 'RAG_HEALTH_CLIENT',
                inject: [rabbitmqConfig.KEY],
                useFactory: (config: ConfigType<typeof rabbitmqConfig>) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${config.user}:${config.password}@${config.host}:${config.port}`,
                        ],
                        queue: RAG_HEALTH_QUEUE,
                        queueOptions: {
                            durable: true,
                        },
                    },
                }),
            },
        ]),
    ],
    controllers: [HealthController],
    providers: [PrismaHealthIndicator],
})
export class HealthModule {}
