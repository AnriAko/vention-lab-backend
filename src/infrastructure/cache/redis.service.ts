import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig } from '~/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client: Redis;

    constructor(
        @Inject(redisConfig.KEY)
        private readonly config: ConfigType<typeof redisConfig>
    ) {
        this.client = new Redis({
            host: this.config.host,
            port: this.config.port,
        });
    }

    getClient(): Redis {
        return this.client;
    }

    async ping(): Promise<string> {
        return this.client.ping();
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }
}
