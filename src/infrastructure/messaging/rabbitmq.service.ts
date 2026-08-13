import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
    connect,
    type Channel,
    type ChannelModel,
    type ConsumeMessage,
    type Options,
} from 'amqplib';

import { fileProcessTopology } from '@shared/file-processing';
import { assertRabbitmqTopology } from '@shared/rabbitmq';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';
import { LoggerService } from '~/infrastructure/logging/logger.service';

const HEALTH_CHECK_EXCHANGE = 'health_check';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
    private connection!: ChannelModel;
    private channel!: Channel;
    private topologyReady = false;

    constructor(
        @Inject(rabbitmqConfig.KEY)
        private readonly config: ConfigType<typeof rabbitmqConfig>,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        this.connection = await connect({
            hostname: this.config.host,
            port: this.config.port,
            username: this.config.user,
            password: this.config.password,
        });

        this.channel = await this.connection.createChannel();
        await this.channel.prefetch(1);
        await this.assertFileProcessingTopology();
    }

    getConnection(): ChannelModel {
        return this.connection;
    }

    getChannel(): Channel {
        return this.channel;
    }

    async assertFileProcessingTopology(): Promise<void> {
        if (this.topologyReady) {
            return;
        }

        await assertRabbitmqTopology(this.channel, fileProcessTopology);

        this.topologyReady = true;
        this.logger.log('[RabbitmqService] file processing topology asserted');
    }

    async publish(
        exchange: string,
        routingKey: string,
        payload: unknown,
        options?: Options.Publish
    ): Promise<boolean> {
        await this.assertFileProcessingTopology();

        return this.channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            {
                persistent: true,
                contentType: 'application/json',
                ...options,
            }
        );
    }

    async consume(
        queue: string,
        onMessage: (msg: ConsumeMessage) => Promise<void>
    ): Promise<void> {
        await this.assertFileProcessingTopology();

        await this.channel.consume(
            queue,
            (msg) => {
                if (!msg) {
                    return;
                }

                void onMessage(msg).catch((error: unknown) => {
                    this.logger.error(
                        `[RabbitmqService] consumer error queue=${queue} ${error instanceof Error ? error.message : String(error)}`
                    );
                    this.channel.nack(msg, false, false);
                });
            },
            { noAck: false }
        );
    }

    ack(msg: ConsumeMessage): void {
        this.channel.ack(msg);
    }

    nack(msg: ConsumeMessage, requeue: boolean): void {
        this.channel.nack(msg, false, requeue);
    }

    async checkConnection(): Promise<boolean> {
        await this.channel.assertExchange(HEALTH_CHECK_EXCHANGE, 'direct', {
            durable: false,
        });

        return true;
    }

    async onModuleDestroy(): Promise<void> {
        await this.channel.close();
        await this.connection.close();
    }
}
