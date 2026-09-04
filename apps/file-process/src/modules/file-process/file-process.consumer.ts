import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage, Options } from 'amqplib';

import { fileProcessTopology } from '~/shared/file-process-contract';
import {
    FILE_PROCESS_EXCHANGE,
    FILE_PROCESS_MAX_RETRIES,
    FILE_PROCESS_QUEUE,
    FILE_PROCESS_RESULTS_EXCHANGE,
    FILE_PROCESS_RESULTS_ROUTING_KEY,
    FILE_PROCESS_RETRY_HEADER,
    FILE_PROCESS_ROUTING_KEY,
} from '~/shared/file-process-contract/constants';
import type { FileProcessJobMessage } from '~/shared/file-process-contract/types';
import { LoggerService } from '~/shared/logger';
import { RabbitmqService } from '~/shared/rabbitmq';

import { TransientProcessingError } from './file-process.errors';
import { FileProcessService } from './file-process.service';

@Injectable()
export class FileProcessConsumer implements OnModuleInit {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly fileProcessService: FileProcessService,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.assertTopology(fileProcessTopology);

        await this.rabbitmq.consume(FILE_PROCESS_QUEUE, (msg) =>
            this.handleMessage(msg)
        );

        this.logger.log(`Consuming ${FILE_PROCESS_QUEUE}`);
    }

    private async handleMessage(msg: ConsumeMessage): Promise<void> {
        const job = this.parseJob(msg);

        if (!job) {
            this.rabbitmq.ack(msg);
            return;
        }

        const retryCount = this.getRetryCount(msg);
        const correlationId = msg.properties.correlationId ?? job.fileId;

        try {
            await this.processAndAck(msg, job, correlationId);
        } catch (error) {
            await this.handleFailure(
                msg,
                job,
                correlationId,
                retryCount,
                error
            );
        }
    }

    private parseJob(msg: ConsumeMessage): FileProcessJobMessage | null {
        let job: FileProcessJobMessage;

        try {
            job = JSON.parse(
                msg.content.toString('utf8')
            ) as FileProcessJobMessage;
        } catch {
            this.logger.error('Invalid process job JSON');
            return null;
        }

        if (!this.isValidJob(job)) {
            this.logger.error('Process job missing required fields');
            return null;
        }

        return job;
    }

    private isValidJob(job: FileProcessJobMessage): boolean {
        return Boolean(
            job?.fileId && job.storageKey && job.organizationId && job.ownerId
        );
    }

    private async processAndAck(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string
    ): Promise<void> {
        await this.reply(msg, this.fileProcessService.processingResult(job), {
            correlationId,
        });

        const result = await this.fileProcessService.processJob(job);

        await this.reply(msg, result, {
            correlationId,
        });
        this.rabbitmq.ack(msg);
    }

    private async handleFailure(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const message = error instanceof Error ? error.message : String(error);

        if (this.fileProcessService.isPermanentError(error)) {
            await this.replyFailed(msg, job, correlationId, message);
            this.rabbitmq.ack(msg);
            return;
        }

        if (!(error instanceof TransientProcessingError)) {
            this.logger.error(
                `Unexpected process error fileId=${job.fileId}: ${message}`
            );
        }

        if (retryCount + 1 >= FILE_PROCESS_MAX_RETRIES) {
            this.logger.error(
                `Process retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );
            await this.replyFailed(
                msg,
                job,
                correlationId,
                `Processing failed after retries: ${message}`
            );
            this.rabbitmq.nack(msg, false);
            return;
        }

        this.logger.warn(
            `Transient process failure fileId=${job.fileId} retry=${retryCount + 1}`
        );

        await this.rabbitmq.publish(
            FILE_PROCESS_EXCHANGE,
            FILE_PROCESS_ROUTING_KEY,
            job,
            {
                correlationId,
                replyTo: msg.properties.replyTo,
                headers: {
                    ...(msg.properties.headers ?? {}),
                    [FILE_PROCESS_RETRY_HEADER]: retryCount + 1,
                },
            }
        );
        this.rabbitmq.ack(msg);
    }

    private async replyFailed(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string,
        error: string
    ): Promise<void> {
        await this.reply(
            msg,
            this.fileProcessService.failedResult(job, error),
            { correlationId }
        );
    }

    private async reply(
        msg: ConsumeMessage,
        payload: unknown,
        options?: Options.Publish
    ): Promise<void> {
        if (!msg.properties.replyTo) {
            await this.rabbitmq.publish(
                FILE_PROCESS_RESULTS_EXCHANGE,
                FILE_PROCESS_RESULTS_ROUTING_KEY,
                payload,
                options
            );
            return;
        }

        await this.rabbitmq.sendToQueue(
            msg.properties.replyTo,
            payload,
            options
        );
    }

    private getRetryCount(msg: ConsumeMessage): number {
        const raw = msg.properties.headers?.[FILE_PROCESS_RETRY_HEADER];
        const value = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }
}
