import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '~/generated/prisma/client';
import { ConfigService } from '@nestjs/config';

import chalk from 'chalk';

import {
    QueryEvent,
    LogEvent,
} from '~/generated/prisma/internal/prismaNamespace';

import { LoggerService } from '~/infrastructure/logging/logger.service';

@Injectable()
export class PrismaService
    extends PrismaClient<{
        adapter: PrismaPg;
        log: (Prisma.LogLevel | Prisma.LogDefinition)[];
        transactionOptions?: {
            maxWait?: number;
            timeout?: number;
            isolationLevel?: Prisma.TransactionIsolationLevel;
        };
    }>
    implements OnModuleInit, OnModuleDestroy
{
    constructor(
        configService: ConfigService,
        private readonly logger: LoggerService
    ) {
        const url = configService.get<string>('database.url');

        const adapter = new PrismaPg({
            connectionString: url as string,
        });

        super({
            adapter,
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'info' },
            ],
        });
    }

    async onModuleInit() {
        await this.$connect();

        this.$on('query', (e: QueryEvent) => {
            const duration = Number(e.duration.toFixed(2));

            let durationColor: (text: string) => string;

            if (duration < 10) {
                durationColor = chalk.green;
            } else if (duration < 50) {
                durationColor = chalk.yellow;
            } else {
                durationColor = chalk.red;
            }

            this.logger.log(
                chalk.cyan('[Prisma] Query') +
                    '\n' +
                    chalk.white(e.query) +
                    '\n' +
                    chalk.gray('Params: ') +
                    chalk.white(JSON.stringify(e.params)) +
                    '\n' +
                    chalk.gray('Duration: ') +
                    durationColor(`${duration}ms`)
            );
        });

        this.$on('warn', (e: LogEvent) => {
            this.logger.warn(
                chalk.yellow(`[Prisma] Warn: ${JSON.stringify(e)}`)
            );
        });

        this.$on('error', (e: LogEvent) => {
            this.logger.error(
                chalk.red(`[Prisma] Error: ${JSON.stringify(e)}`)
            );
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
