import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { connect, Channel, ChannelModel } from 'amqplib';
import { rabbitmqConfig } from '~/config/configuration/rabbitmq.config';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
    private connection!: ChannelModel;
    private channel!: Channel;

    constructor(
        @Inject(rabbitmqConfig.KEY)
        private readonly config: ConfigType<typeof rabbitmqConfig>
    ) {}

    async onModuleInit(): Promise<void> {
        this.connection = await connect({
            hostname: this.config.host,
            port: this.config.port,
            username: this.config.user,
            password: this.config.password,
        });

        this.channel = await this.connection.createChannel();
    }

    getConnection(): ChannelModel {
        return this.connection;
    }

    getChannel(): Channel {
        return this.channel;
    }

    async checkConnection(): Promise<boolean> {
        await this.channel.assertExchange('health_check', 'direct', {
            durable: false,
        });

        return true;
    }

    async onModuleDestroy(): Promise<void> {
        await this.channel.close();
        await this.connection.close();
    }
}
