import {
    Inject,
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import chalk from 'chalk';
import Redis from 'ioredis';
import { RedisPrefix } from '~/common/types/redis.types';
import { redisConfig } from '~/config';
import { LoggerService } from '~/infrastructure/logging/logger.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly client: Redis;

    constructor(
        @Inject(redisConfig.KEY)
        private readonly config: ConfigType<typeof redisConfig>,
        private readonly logger: LoggerService
    ) {
        this.client = new Redis({
            host: this.config.host,
            port: this.config.port,
            maxRetriesPerRequest: 5,
        });

        this.client.on('error', (error) => {
            this.logger.error(
                `Redis error: ${error.message}\n${error.stack ?? ''}`
            );
        });
    }

    async onModuleInit(): Promise<void> {
        await this.client.ping();
        console.log(
            chalk.green('[System]') + ' ' + chalk.white(`Redis connected`)
        );
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }

    private buildKey(prefix: RedisPrefix, key: string): string {
        return `${prefix}:${key}`;
    }

    ping(): Promise<string> {
        return this.client.ping();
    }

    get(prefix: RedisPrefix, key: string): Promise<string | null> {
        return this.client.get(this.buildKey(prefix, key));
    }

    async set(prefix: RedisPrefix, key: string, value: string): Promise<void> {
        await this.client.set(this.buildKey(prefix, key), value);
    }

    async setWithExpiry(
        prefix: RedisPrefix,
        key: string,
        value: string,
        expiry: number
    ): Promise<void> {
        await this.client.set(this.buildKey(prefix, key), value, 'EX', expiry);
    }

    async del(prefix: RedisPrefix, key: string): Promise<void> {
        await this.client.del(this.buildKey(prefix, key));
    }

    async exists(prefix: RedisPrefix, key: string): Promise<boolean> {
        return (await this.client.exists(this.buildKey(prefix, key))) === 1;
    }

    ttl(prefix: RedisPrefix, key: string): Promise<number> {
        return this.client.ttl(this.buildKey(prefix, key));
    }

    async getJson<T>(prefix: RedisPrefix, key: string): Promise<T | null> {
        const value = await this.get(prefix, key);

        if (!value) {
            return null;
        }

        return JSON.parse(value) as T;
    }

    async setJson(
        prefix: RedisPrefix,
        key: string,
        value: unknown,
        expiry?: number
    ): Promise<void> {
        const serialized = JSON.stringify(value);

        if (expiry !== undefined) {
            await this.setWithExpiry(prefix, key, serialized, expiry);
            return;
        }

        await this.set(prefix, key, serialized);
    }
}
