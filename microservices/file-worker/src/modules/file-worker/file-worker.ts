import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage, Options } from 'amqplib';

import { fileWorkerTopology } from '~/shared/file-worker-contract';
import {
    FILE_WORKER_DELETE_MAX_RETRIES,
    FILE_WORKER_DELETE_QUEUE,
    FILE_WORKER_DELETE_RETRY_HEADER,
    FILE_WORKER_DELETE_ROUTING_KEY,
    FILE_WORKER_EXCHANGE,
    FILE_WORKER_PROCESSING_MAX_RETRIES,
    FILE_WORKER_PROCESSING_QUEUE,
    FILE_WORKER_PROCESSING_RESULTS_EXCHANGE,
    FILE_WORKER_PROCESSING_RESULTS_ROUTING_KEY,
    FILE_WORKER_PROCESSING_RETRY_HEADER,
    FILE_WORKER_PROCESSING_ROUTING_KEY,
} from '~/shared/file-worker-contract/constants';
import type {
    FileDeleteJobMessage,
    FileProcessJobMessage,
} from '~/shared/file-worker-contract/types';
import { LoggerService } from '~/shared/logger';
import { RabbitmqService } from '~/shared/rabbitmq';

import { TransientDeleteError } from './file-delete.errors';
import { FileDeleteService } from './file-delete.service';
import { TransientProcessingError } from './file-process.errors';
import { FileWorkerService } from './file-worker.service';

@Injectable()
export class FileWorker implements OnModuleInit {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly fileWorkerService: FileWorkerService,
        private readonly fileDeleteService: FileDeleteService,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.assertTopology(fileWorkerTopology);

        await this.rabbitmq.consume(FILE_WORKER_PROCESSING_QUEUE, (msg) =>
            this.handleProcessMessage(msg)
        );

        await this.rabbitmq.consume(FILE_WORKER_DELETE_QUEUE, (msg) =>
            this.handleDeleteMessage(msg)
        );

        this.logger.log(
            `Consuming ${FILE_WORKER_PROCESSING_QUEUE}, ${FILE_WORKER_DELETE_QUEUE}`
        );
    }

    private async handleProcessMessage(msg: ConsumeMessage): Promise<void> {
        const job = this.parseProcessJob(msg);

        if (!job) {
            this.rabbitmq.ack(msg);
            return;
        }

        const retryCount = this.getRetryCount(
            msg,
            FILE_WORKER_PROCESSING_RETRY_HEADER
        );
        const correlationId = msg.properties.correlationId ?? job.fileId;

        try {
            await this.processAndAck(msg, job, correlationId);
        } catch (error) {
            await this.handleProcessFailure(
                msg,
                job,
                correlationId,
                retryCount,
                error
            );
        }
    }

    private async handleDeleteMessage(msg: ConsumeMessage): Promise<void> {
        const job = this.parseDeleteJob(msg);

        if (!job) {
            this.rabbitmq.ack(msg);
            return;
        }

        const retryCount = this.getRetryCount(
            msg,
            FILE_WORKER_DELETE_RETRY_HEADER
        );

        try {
            await this.fileDeleteService.deleteJob(job);
            this.rabbitmq.ack(msg);
        } catch (error) {
            await this.handleDeleteFailure(msg, job, retryCount, error);
        }
    }

    private parseProcessJob(msg: ConsumeMessage): FileProcessJobMessage | null {
        let job: FileProcessJobMessage;

        try {
            job = JSON.parse(
                msg.content.toString('utf8')
            ) as FileProcessJobMessage;
        } catch {
            this.logger.error('Invalid process job JSON');
            return null;
        }

        if (!this.isValidProcessJob(job)) {
            this.logger.error('Process job missing required fields');
            return null;
        }

        return job;
    }

    private parseDeleteJob(msg: ConsumeMessage): FileDeleteJobMessage | null {
        let job: FileDeleteJobMessage;

        try {
            job = JSON.parse(
                msg.content.toString('utf8')
            ) as FileDeleteJobMessage;
        } catch {
            this.logger.error('Invalid delete job JSON');
            return null;
        }

        if (!job?.fileId) {
            this.logger.error('Delete job missing fileId');
            return null;
        }

        return job;
    }

    private isValidProcessJob(job: FileProcessJobMessage): boolean {
        return Boolean(
            job?.fileId && job.storageKey && job.organizationId && job.ownerId
        );
    }

    private async processAndAck(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string
    ): Promise<void> {
        await this.reply(msg, this.fileWorkerService.processingResult(job), {
            correlationId,
        });

        const result = await this.fileWorkerService.processJob(job);

        await this.reply(msg, result, {
            correlationId,
        });
        this.rabbitmq.ack(msg);
    }

    private async handleProcessFailure(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const message = error instanceof Error ? error.message : String(error);

        if (this.fileWorkerService.isPermanentError(error)) {
            await this.replyFailed(msg, job, correlationId, message);
            this.rabbitmq.ack(msg);
            return;
        }

        if (!(error instanceof TransientProcessingError)) {
            this.logger.error(
                `Unexpected process error fileId=${job.fileId}: ${message}`
            );
        }

        if (retryCount + 1 >= FILE_WORKER_PROCESSING_MAX_RETRIES) {
            await this.handleProcessRetryExhausted(
                msg,
                job,
                correlationId,
                retryCount,
                message
            );
            return;
        }

        await this.republishProcessWithRetry(
            msg,
            job,
            correlationId,
            retryCount
        );
    }

    private async handleDeleteFailure(
        msg: ConsumeMessage,
        job: FileDeleteJobMessage,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const message = error instanceof Error ? error.message : String(error);

        if (this.fileDeleteService.isPermanentError(error)) {
            this.logger.error(
                `Permanent delete error fileId=${job.fileId}: ${message}`
            );
            this.rabbitmq.ack(msg);
            return;
        }

        if (!(error instanceof TransientDeleteError)) {
            this.logger.error(
                `Unexpected delete error fileId=${job.fileId}: ${message}`
            );
        }

        if (retryCount + 1 >= FILE_WORKER_DELETE_MAX_RETRIES) {
            this.logger.error(
                `Delete retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );
            this.rabbitmq.nack(msg, false);
            return;
        }

        await this.republishDeleteWithRetry(msg, job, retryCount);
    }

    private async replyFailed(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string,
        error: string
    ): Promise<void> {
        await this.reply(msg, this.fileWorkerService.failedResult(job, error), {
            correlationId,
        });
    }

    private async handleProcessRetryExhausted(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string,
        retryCount: number,
        message: string
    ): Promise<void> {
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
    }

    private async republishProcessWithRetry(
        msg: ConsumeMessage,
        job: FileProcessJobMessage,
        correlationId: string,
        retryCount: number
    ): Promise<void> {
        this.logger.warn(
            `Transient process failure fileId=${job.fileId} retry=${retryCount + 1}`
        );

        await this.rabbitmq.publish(
            FILE_WORKER_EXCHANGE,
            FILE_WORKER_PROCESSING_ROUTING_KEY,
            job,
            {
                correlationId,
                replyTo: msg.properties.replyTo,
                headers: {
                    ...(msg.properties.headers ?? {}),
                    [FILE_WORKER_PROCESSING_RETRY_HEADER]: retryCount + 1,
                },
            }
        );
        this.rabbitmq.ack(msg);
    }

    private async republishDeleteWithRetry(
        msg: ConsumeMessage,
        job: FileDeleteJobMessage,
        retryCount: number
    ): Promise<void> {
        this.logger.warn(
            `Transient delete failure fileId=${job.fileId} retry=${retryCount + 1}`
        );

        await this.rabbitmq.publish(
            FILE_WORKER_EXCHANGE,
            FILE_WORKER_DELETE_ROUTING_KEY,
            job,
            {
                headers: {
                    ...(msg.properties.headers ?? {}),
                    [FILE_WORKER_DELETE_RETRY_HEADER]: retryCount + 1,
                },
            }
        );
        this.rabbitmq.ack(msg);
    }

    private async reply(
        msg: ConsumeMessage,
        payload: unknown,
        options?: Options.Publish
    ): Promise<void> {
        if (!msg.properties.replyTo) {
            await this.rabbitmq.publish(
                FILE_WORKER_PROCESSING_RESULTS_EXCHANGE,
                FILE_WORKER_PROCESSING_RESULTS_ROUTING_KEY,
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

    private getRetryCount(msg: ConsumeMessage, header: string): number {
        const raw = msg.properties.headers?.[header];
        const value = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }
}
