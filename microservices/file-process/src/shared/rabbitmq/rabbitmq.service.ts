import {
    Inject,
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import {
    connect,
    type Channel,
    type ChannelModel,
    type ConsumeMessage,
    type Options,
} from 'amqplib';

import { LoggerService } from '../logger';
import { assertRabbitmqTopology } from './topology';
import {
    RABBITMQ_HEALTH_CHECK_EXCHANGE,
    RABBITMQ_OPTIONS,
    type RabbitmqOptions,
    type RabbitmqTopology,
} from './types';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
    private connection!: ChannelModel;
    private channel!: Channel;

    constructor(
        @Inject(RABBITMQ_OPTIONS)
        private readonly options: RabbitmqOptions,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        this.connection = await connect({
            hostname: this.options.host,
            port: this.options.port,
            username: this.options.user,
            password: this.options.password,
        });

        this.channel = await this.connection.createChannel();
        await this.channel.prefetch(this.options.prefetch ?? 1);
    }

    async assertTopology(topology: RabbitmqTopology): Promise<void> {
        await assertRabbitmqTopology(this.channel, topology);
    }

    async consume(
        queue: string,
        onMessage: (msg: ConsumeMessage) => Promise<void>
    ): Promise<void> {
        await this.channel.consume(
            queue,
            (msg) => {
                if (!msg) {
                    return;
                }

                void onMessage(msg).catch((error: unknown) => {
                    const message =
                        error instanceof Error ? error.message : String(error);
                    this.logger.error(
                        `consumer error queue=${queue} ${message}`
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

    async publish(
        exchange: string,
        routingKey: string,
        payload: unknown,
        options?: Options.Publish
    ): Promise<boolean> {
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

    async sendToQueue(
        queue: string,
        payload: unknown,
        options?: Options.Publish
    ): Promise<boolean> {
        return this.channel.sendToQueue(
            queue,
            Buffer.from(JSON.stringify(payload)),
            {
                persistent: true,
                contentType: 'application/json',
                ...options,
            }
        );
    }

    async checkConnection(): Promise<boolean> {
        await this.channel.assertExchange(
            RABBITMQ_HEALTH_CHECK_EXCHANGE,
            'direct',
            { durable: false }
        );

        return true;
    }

    async onModuleDestroy(): Promise<void> {
        await this.channel?.close();
        await this.connection?.close();
    }
}
