import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Readable } from 'node:stream';
import NodeClam from 'clamscan';
import chalk from 'chalk';

import { AppException } from '~/common/errors/app-exception';
import { clamavConfig } from '~/config/configuration/clamav.config';
import { FileErrors } from '~/modules/files/files.errors';
import { LoggerService } from '~/infrastructure/logging/logger.service';

@Injectable()
export class ClamAvService implements OnModuleInit {
    private scanner: NodeClam | null = null;

    constructor(
        @Inject(clamavConfig.KEY)
        private readonly config: ConfigType<typeof clamavConfig>,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        if (!this.config.enabled) {
            console.log(
                chalk.yellow('[System]') +
                    ' ' +
                    chalk.white(
                        'ClamAV disabled (CLAMAV_ENABLED=false) — uploads skip antivirus scan'
                    )
            );
            return;
        }

        try {
            this.scanner = await new NodeClam().init({
                removeInfected: false,
                quarantineInfected: false,
                debugMode: false,
                clamscan: {
                    active: false,
                },
                clamdscan: {
                    host: this.config.host!,
                    port: this.config.port!,
                    timeout: this.config.timeoutMs!,
                    localFallback: false,
                    active: true,
                    bypassTest: false,
                },
                preference: 'clamdscan',
            });

            await this.scanner.ping();

            console.log(
                chalk.green('[System]') +
                    ' ' +
                    chalk.white('ClamAV connected')
            );
        } catch (error) {
            this.scanner = null;
            this.logger.error(
                `ClamAV init failed: ${error instanceof Error ? error.message : String(error)}`
            );
            throw error;
        }
    }

    async scanBuffer(buffer: Buffer): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        if (!this.scanner) {
            throw new AppException(FileErrors.AV_UNAVAILABLE);
        }

        try {
            const stream = Readable.from(buffer);
            const result = await this.scanner.scanStream(stream);

            if (result.isInfected) {
                throw new AppException(FileErrors.INFECTED, {
                    details: {
                        viruses: result.viruses,
                    },
                });
            }

            if (result.isInfected === null) {
                throw new AppException(FileErrors.AV_UNAVAILABLE, {
                    message: 'Antivirus scan returned an inconclusive result',
                });
            }
        } catch (error) {
            if (error instanceof AppException) {
                throw error;
            }

            this.logger.error(
                `ClamAV scan failed: ${error instanceof Error ? error.message : String(error)}`
            );

            throw new AppException(FileErrors.AV_UNAVAILABLE);
        }
    }
}
