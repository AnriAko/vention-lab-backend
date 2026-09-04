import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage, Options } from 'amqplib';

import { ragTopology } from '@vention/rag-contract';
import {
    RAG_DELETE_MAX_RETRIES,
    RAG_DELETE_QUEUE,
    RAG_DELETE_RETRY_HEADER,
    RAG_DELETE_ROUTING_KEY,
    RAG_EXCHANGE,
    RAG_PROCESS_MAX_RETRIES,
    RAG_PROCESS_QUEUE,
    RAG_PROCESS_RESULTS_EXCHANGE,
    RAG_PROCESS_RESULTS_ROUTING_KEY,
    RAG_PROCESS_RETRY_HEADER,
    RAG_PROCESS_ROUTING_KEY,
} from '@vention/rag-contract/constants';
import type {
    RagFileDeleteJobMessage,
    RagFileProcessJobMessage,
} from '@vention/rag-contract/types';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

import { TransientDeleteError } from './rag-file-delete.errors';
import { RagFileDeleteService } from './rag-file-delete.service';
import { TransientRagError } from './rag-file-process.errors';
import { RagFileProcessService } from './rag-file-process.service';

@Injectable()
export class RagFileWorker implements OnModuleInit {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly ragProcessService: RagFileProcessService,
        private readonly ragDeleteService: RagFileDeleteService,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.assertTopology(ragTopology);

        await this.rabbitmq.consume(RAG_PROCESS_QUEUE, (msg) =>
            this.handleProcessMessage(msg)
        );

        await this.rabbitmq.consume(RAG_DELETE_QUEUE, (msg) =>
            this.handleDeleteMessage(msg)
        );

        this.logger.log(`Consuming ${RAG_PROCESS_QUEUE}, ${RAG_DELETE_QUEUE}`);
    }

    private async handleProcessMessage(msg: ConsumeMessage): Promise<void> {
        const job = this.parseProcessJob(msg);

        if (!job) {
            this.rabbitmq.ack(msg);
            return;
        }

        const retryCount = this.getRetryCount(msg, RAG_PROCESS_RETRY_HEADER);
        const correlationId = msg.properties.correlationId ?? job.fileId;

        try {
            await this.reply(
                msg,
                this.ragProcessService.processingResult(job),
                { correlationId }
            );

            const result = await this.ragProcessService.processJob(job);

            await this.reply(msg, result, { correlationId });
            this.rabbitmq.ack(msg);
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

        const retryCount = this.getRetryCount(msg, RAG_DELETE_RETRY_HEADER);

        try {
            await this.ragDeleteService.deleteJob(job);
            this.rabbitmq.ack(msg);
        } catch (error) {
            await this.handleDeleteFailure(msg, job, retryCount, error);
        }
    }

    private parseProcessJob(
        msg: ConsumeMessage
    ): RagFileProcessJobMessage | null {
        let job: RagFileProcessJobMessage;

        try {
            job = JSON.parse(
                msg.content.toString('utf8')
            ) as RagFileProcessJobMessage;
        } catch {
            this.logger.error('Invalid RAG process job JSON');
            return null;
        }

        if (
            !job?.fileId ||
            !job.storageKey ||
            !job.organizationId ||
            !job.ownerId
        ) {
            this.logger.error('RAG process job missing required fields');
            return null;
        }

        return job;
    }

    private parseDeleteJob(
        msg: ConsumeMessage
    ): RagFileDeleteJobMessage | null {
        let job: RagFileDeleteJobMessage;

        try {
            job = JSON.parse(
                msg.content.toString('utf8')
            ) as RagFileDeleteJobMessage;
        } catch {
            this.logger.error('Invalid RAG delete job JSON');
            return null;
        }

        if (!job?.fileId) {
            this.logger.error('RAG delete job missing fileId');
            return null;
        }

        return job;
    }

    private async handleProcessFailure(
        msg: ConsumeMessage,
        job: RagFileProcessJobMessage,
        correlationId: string,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const message = error instanceof Error ? error.message : String(error);

        if (this.ragProcessService.isPermanentError(error)) {
            await this.reply(
                msg,
                this.ragProcessService.failedResult(job, message),
                { correlationId }
            );
            this.rabbitmq.ack(msg);
            return;
        }

        if (!(error instanceof TransientRagError)) {
            this.logger.error(
                `Unexpected RAG process error fileId=${job.fileId}: ${message}`
            );
        }

        if (retryCount + 1 >= RAG_PROCESS_MAX_RETRIES) {
            this.logger.error(
                `RAG process retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );
            await this.reply(
                msg,
                this.ragProcessService.failedResult(
                    job,
                    `Processing failed after retries: ${message}`
                ),
                { correlationId }
            );
            this.rabbitmq.nack(msg, false);
            return;
        }

        this.logger.warn(
            `Transient RAG process failure fileId=${job.fileId} retry=${retryCount + 1}`
        );

        await this.rabbitmq.publish(
            RAG_EXCHANGE,
            RAG_PROCESS_ROUTING_KEY,
            job,
            {
                correlationId,
                replyTo: msg.properties.replyTo,
                headers: {
                    ...(msg.properties.headers ?? {}),
                    [RAG_PROCESS_RETRY_HEADER]: retryCount + 1,
                },
            }
        );
        this.rabbitmq.ack(msg);
    }

    private async handleDeleteFailure(
        msg: ConsumeMessage,
        job: RagFileDeleteJobMessage,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const message = error instanceof Error ? error.message : String(error);

        if (this.ragDeleteService.isPermanentError(error)) {
            this.logger.error(
                `Permanent RAG delete error fileId=${job.fileId}: ${message}`
            );
            this.rabbitmq.ack(msg);
            return;
        }

        if (!(error instanceof TransientDeleteError)) {
            this.logger.error(
                `Unexpected RAG delete error fileId=${job.fileId}: ${message}`
            );
        }

        if (retryCount + 1 >= RAG_DELETE_MAX_RETRIES) {
            this.logger.error(
                `RAG delete retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );
            this.rabbitmq.nack(msg, false);
            return;
        }

        this.logger.warn(
            `Transient RAG delete failure fileId=${job.fileId} retry=${retryCount + 1}`
        );

        await this.rabbitmq.publish(RAG_EXCHANGE, RAG_DELETE_ROUTING_KEY, job, {
            headers: {
                ...(msg.properties.headers ?? {}),
                [RAG_DELETE_RETRY_HEADER]: retryCount + 1,
            },
        });
        this.rabbitmq.ack(msg);
    }

    private async reply(
        msg: ConsumeMessage,
        payload: unknown,
        options?: Options.Publish
    ): Promise<void> {
        if (!msg.properties.replyTo) {
            await this.rabbitmq.publish(
                RAG_PROCESS_RESULTS_EXCHANGE,
                RAG_PROCESS_RESULTS_ROUTING_KEY,
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
