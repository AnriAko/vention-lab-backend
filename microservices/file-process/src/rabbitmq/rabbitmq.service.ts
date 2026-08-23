import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    connect,
    type Channel,
    type ChannelModel,
    type ConsumeMessage,
    type Options,
} from 'amqplib';

import {
    FILE_PROCESSING_QUEUE,
    FILE_PROCESSING_RESULTS_EXCHANGE,
    FILE_PROCESSING_RESULTS_ROUTING_KEY,
} from '@shared/file-processing/constants';

import { fileProcessTopology } from '@shared/file-processing';
import { assertRabbitmqTopology } from '@shared/rabbitmq';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
    private connection!: ChannelModel;
    private channel!: Channel;

    constructor(private readonly config: ConfigService) {}

    async onModuleInit(): Promise<void> {
        this.connection = await connect({
            hostname: this.config.getOrThrow<string>('RABBITMQ_HOST'),
            port: this.config.getOrThrow<number>('RABBITMQ_PORT'),
            username: this.config.getOrThrow<string>('RABBITMQ_USER'),
            password: this.config.getOrThrow<string>('RABBITMQ_PASSWORD'),
        });

        this.channel = await this.connection.createChannel();
        await this.channel.prefetch(1);
        await this.assertTopology();
    }

    async assertTopology(): Promise<void> {
        await assertRabbitmqTopology(this.channel, fileProcessTopology);
    }

    async consume(
        onMessage: (msg: ConsumeMessage) => Promise<void>
    ): Promise<void> {
        await this.channel.consume(
            FILE_PROCESSING_QUEUE,
            (msg) => {
                if (!msg) {
                    return;
                }

                void onMessage(msg).catch(() => {
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

    async reply(
        replyTo: string | undefined,
        payload: unknown,
        options?: Options.Publish
    ): Promise<void> {
        const body = Buffer.from(JSON.stringify(payload));

        if (replyTo) {
            this.channel.sendToQueue(replyTo, body, {
                persistent: true,
                contentType: 'application/json',
                ...options,
            });
            return;
        }

        this.channel.publish(
            FILE_PROCESSING_RESULTS_EXCHANGE,
            FILE_PROCESSING_RESULTS_ROUTING_KEY,
            body,
            {
                persistent: true,
                contentType: 'application/json',
                ...options,
            }
        );
    }

    async publish(
        exchange: string,
        routingKey: string,
        payload: unknown,
        options?: Options.Publish
    ): Promise<void> {
        this.channel.publish(
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

    async onModuleDestroy(): Promise<void> {
        await this.channel.close();
        await this.connection.close();
    }
}
