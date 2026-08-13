import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';

import {
    FILE_PROCESSING_EXCHANGE,
    FILE_PROCESSING_MAX_RETRIES,
    FILE_PROCESSING_QUEUE,
    FILE_PROCESSING_RETRY_HEADER,
    FILE_PROCESSING_ROUTING_KEY,
} from '@shared/file-processing/constants';
import type { FileProcessJobMessage } from '@shared/file-processing/messages';
import { RabbitmqService } from '~/rabbitmq/rabbitmq.service';
import {
    FileProcessService,
    TransientProcessingError,
} from './file-process.service';

@Injectable()
export class FileProcessConsumer implements OnModuleInit {
    private readonly logger = new Logger(FileProcessConsumer.name);

    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly fileProcessService: FileProcessService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.consume((msg) => this.handleMessage(msg));
        this.logger.log(`Consuming ${FILE_PROCESSING_QUEUE}`);
    }

    private async handleMessage(msg: ConsumeMessage): Promise<void> {
        let job: FileProcessJobMessage;

        try {
            job = JSON.parse(
                msg.content.toString('utf8')
            ) as FileProcessJobMessage;
        } catch {
            this.logger.error('Invalid job JSON');
            this.rabbitmq.ack(msg);
            return;
        }

        if (
            !job?.fileId ||
            !job.storageKey ||
            !job.organizationId ||
            !job.ownerId
        ) {
            this.logger.error('Job missing required fields');
            this.rabbitmq.ack(msg);
            return;
        }

        const retryCount = this.getRetryCount(msg);
        const correlationId = msg.properties.correlationId ?? job.fileId;

        try {
            await this.rabbitmq.reply(
                msg.properties.replyTo,
                this.fileProcessService.processingResult(job),
                { correlationId }
            );

            const result = await this.fileProcessService.processJob(job);

            await this.rabbitmq.reply(msg.properties.replyTo, result, {
                correlationId,
            });
            this.rabbitmq.ack(msg);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);

            if (this.fileProcessService.isPermanentError(error)) {
                await this.rabbitmq.reply(
                    msg.properties.replyTo,
                    this.fileProcessService.failedResult(job, message),
                    { correlationId }
                );
                this.rabbitmq.ack(msg);
                return;
            }

            if (!(error instanceof TransientProcessingError)) {
                this.logger.error(
                    `Unexpected error fileId=${job.fileId}: ${message}`
                );
            }

            if (retryCount + 1 >= FILE_PROCESSING_MAX_RETRIES) {
                this.logger.error(
                    `Retry exhausted fileId=${job.fileId} retries=${retryCount}`
                );
                await this.rabbitmq.reply(
                    msg.properties.replyTo,
                    this.fileProcessService.failedResult(
                        job,
                        `Processing failed after retries: ${message}`
                    ),
                    { correlationId }
                );
                this.rabbitmq.nack(msg, false);
                return;
            }

            this.logger.warn(
                `Transient failure fileId=${job.fileId} retry=${retryCount + 1}`
            );

            await this.rabbitmq.publish(
                FILE_PROCESSING_EXCHANGE,
                FILE_PROCESSING_ROUTING_KEY,
                job,
                {
                    correlationId,
                    replyTo: msg.properties.replyTo,
                    headers: {
                        ...(msg.properties.headers ?? {}),
                        [FILE_PROCESSING_RETRY_HEADER]: retryCount + 1,
                    },
                }
            );
            this.rabbitmq.ack(msg);
        }
    }

    private getRetryCount(msg: ConsumeMessage): number {
        const raw = msg.properties.headers?.[FILE_PROCESSING_RETRY_HEADER];
        const value = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }
}
