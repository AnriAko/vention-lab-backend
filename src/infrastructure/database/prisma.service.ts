import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '~/generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '~/shared/logger';

import {
    QueryEvent,
    LogEvent,
} from '~/generated/prisma/internal/prismaNamespace';
import chalk from 'chalk';
import { getRawPrismaQuery } from '~/infrastructure/database/utils/prisma-query-formatter';

@Injectable()
export class PrismaService
    extends PrismaClient<{
        adapter: PrismaPg;
        log: (Prisma.LogLevel | Prisma.LogDefinition)[];
    }>
    implements OnModuleInit, OnModuleDestroy
{
    constructor(
        configService: ConfigService,
        private readonly logger: LoggerService
    ) {
        const adapter = new PrismaPg({
            connectionString: configService.get<string>('database.url')!,
        });

        super({
            adapter,
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ],
        });
    }

    async onModuleInit() {
        await this.$connect();
        console.log(
            chalk.green('[System]') +
                ' ' +
                chalk.white(`Prisma connected to database`)
        );
        const label = 'Prisma';

        this.$on('query', (e: QueryEvent) => {
            const duration = Number(e.duration.toFixed());

            const rawSql = getRawPrismaQuery(e.query, e.params);

            this.logger.log({
                message: `[Prisma] query ${duration}ms`,
                sql: rawSql,
            });

            if (duration > 50) {
                this.logger.warn({
                    message: `[Prisma] SLOW QUERY ${duration}ms`,
                    sql: rawSql,
                });
            }
        });

        this.$on('warn', (e: LogEvent) => {
            this.logger.warn(`[${label}] warn ${JSON.stringify(e)}`);
        });

        this.$on('error', (e: LogEvent) => {
            this.logger.error(`[${label}] error ${JSON.stringify(e)}`);
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
