import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';

import {
    AI_DOCUMENT_DELETE_MAX_RETRIES,
    AI_DOCUMENT_DELETE_RETRY_HEADER,
    AI_DOCUMENT_DELETE_ROUTING_KEY,
    AI_DOCUMENT_EXCHANGE,
    AI_DOCUMENT_PROCESS_MAX_RETRIES,
    AI_DOCUMENT_PROCESS_RETRY_HEADER,
    AI_DOCUMENT_PROCESS_ROUTING_KEY,
    AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE,
    AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
} from '@vention/rag-contract/constants';

import type {
    AiDocumentDeleteJobMessage,
    AiDocumentProcessJobMessage,
} from '@vention/rag-contract/types';

import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

import {
    TransientAiDocumentError,
    TransientDeleteError,
} from './ai-document.errors';
import { AiDocumentService } from './ai-document.service';

@Controller()
export class AiDocumentController {
    constructor(
        private readonly aiDocumentService: AiDocumentService,
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    @EventPattern(AI_DOCUMENT_PROCESS_ROUTING_KEY)
    async handleProcess(
        @Payload() job: AiDocumentProcessJobMessage,
        @Ctx() context: RmqContext
    ): Promise<void> {
        const message = context.getMessage() as ConsumeMessage;
        const channel = context.getChannelRef() as Channel;

        if (!this.isValidProcessJob(job)) {
            this.logger.error(
                '[AiDocumentController] Process job missing required fields'
            );

            channel.ack(message);
            return;
        }

        const retryCount = this.getRetryCount(
            message,
            AI_DOCUMENT_PROCESS_RETRY_HEADER
        );

        const correlationId = this.getCorrelationId(message, job.fileId);

        try {
            await this.publishProcessResult(
                message,
                this.aiDocumentService.processingResult(job),
                correlationId
            );

            const result = await this.aiDocumentService.processJob(job);

            await this.publishProcessResult(message, result, correlationId);

            channel.ack(message);
        } catch (error) {
            await this.handleProcessFailure(
                job,
                message,
                channel,
                retryCount,
                correlationId,
                error
            );
        }
    }

    @EventPattern(AI_DOCUMENT_DELETE_ROUTING_KEY)
    async handleDelete(
        @Payload() job: AiDocumentDeleteJobMessage,
        @Ctx() context: RmqContext
    ): Promise<void> {
        const message = context.getMessage() as ConsumeMessage;
        const channel = context.getChannelRef() as Channel;

        if (!this.isValidDeleteJob(job)) {
            this.logger.error(
                '[AiDocumentController] Delete job missing required fields'
            );

            channel.ack(message);
            return;
        }

        const retryCount = this.getRetryCount(
            message,
            AI_DOCUMENT_DELETE_RETRY_HEADER
        );

        try {
            await this.aiDocumentService.deleteJob(job);

            channel.ack(message);
        } catch (error) {
            await this.handleDeleteFailure(
                job,
                message,
                channel,
                retryCount,
                error
            );
        }
    }

    private async handleProcessFailure(
        job: AiDocumentProcessJobMessage,
        message: ConsumeMessage,
        channel: Channel,
        retryCount: number,
        correlationId: string,
        error: unknown
    ): Promise<void> {
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        if (this.aiDocumentService.isPermanentProcessError(error)) {
            await this.publishProcessResult(
                message,
                this.aiDocumentService.failedResult(job, errorMessage),
                correlationId
            );

            channel.ack(message);
            return;
        }

        if (!(error instanceof TransientAiDocumentError)) {
            this.logger.error(
                `[AiDocumentController] unexpected process error fileId=${job.fileId}: ${errorMessage}`
            );
        }

        if (retryCount + 1 >= AI_DOCUMENT_PROCESS_MAX_RETRIES) {
            this.logger.error(
                `[AiDocumentController] process retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );

            await this.publishProcessResult(
                message,
                this.aiDocumentService.failedResult(
                    job,
                    `Processing failed after retries: ${errorMessage}`
                ),
                correlationId
            );

            channel.nack(message, false, false);
            return;
        }

        const nextRetry = retryCount + 1;

        this.logger.warn(
            `[AiDocumentController] transient process failure fileId=${job.fileId} retry=${nextRetry}`
        );

        await this.rabbitmq.publish(
            AI_DOCUMENT_EXCHANGE,
            AI_DOCUMENT_PROCESS_ROUTING_KEY,
            job,
            {
                correlationId,
                type: AI_DOCUMENT_PROCESS_ROUTING_KEY,
                replyTo: message.properties.replyTo,
                headers: {
                    ...this.copyHeaders(message.properties.headers),
                    [AI_DOCUMENT_PROCESS_RETRY_HEADER]: nextRetry,
                },
            }
        );

        channel.ack(message);
    }

    private async handleDeleteFailure(
        job: AiDocumentDeleteJobMessage,
        message: ConsumeMessage,
        channel: Channel,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        if (this.aiDocumentService.isPermanentDeleteError(error)) {
            this.logger.error(
                `[AiDocumentController] permanent delete error fileId=${job.fileId}: ${errorMessage}`
            );

            channel.ack(message);
            return;
        }

        if (!(error instanceof TransientDeleteError)) {
            this.logger.error(
                `[AiDocumentController] unexpected delete error fileId=${job.fileId}: ${errorMessage}`
            );
        }

        if (retryCount + 1 >= AI_DOCUMENT_DELETE_MAX_RETRIES) {
            this.logger.error(
                `[AiDocumentController] delete retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );

            channel.nack(message, false, false);
            return;
        }

        const nextRetry = retryCount + 1;

        this.logger.warn(
            `[AiDocumentController] transient delete failure fileId=${job.fileId} retry=${nextRetry}`
        );

        await this.rabbitmq.publish(
            AI_DOCUMENT_EXCHANGE,
            AI_DOCUMENT_DELETE_ROUTING_KEY,
            job,
            {
                type: AI_DOCUMENT_DELETE_ROUTING_KEY,
                headers: {
                    ...this.copyHeaders(message.properties.headers),
                    [AI_DOCUMENT_DELETE_RETRY_HEADER]: nextRetry,
                },
            }
        );

        channel.ack(message);
    }

    private async publishProcessResult(
        message: ConsumeMessage,
        payload: unknown,
        correlationId: string
    ): Promise<void> {
        if (message.properties.replyTo) {
            await this.rabbitmq.sendToQueue(
                message.properties.replyTo,
                payload,
                {
                    correlationId,
                    type: AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
                }
            );

            return;
        }

        await this.rabbitmq.publish(
            AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE,
            AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
            payload,
            {
                correlationId,
                type: AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
            }
        );
    }

    private getCorrelationId(
        message: ConsumeMessage,
        fallback: string
    ): string {
        const correlationId = message.properties.correlationId;

        return typeof correlationId === 'string' && correlationId.length > 0
            ? correlationId
            : fallback;
    }

    private copyHeaders(
        headers: ConsumeMessage['properties']['headers']
    ): Record<string, unknown> {
        return headers ? { ...(headers as Record<string, unknown>) } : {};
    }

    private getRetryCount(message: ConsumeMessage, header: string): number {
        const raw = message.properties.headers?.[header];
        const value = typeof raw === 'number' ? raw : Number(raw);

        return Number.isFinite(value) && value > 0 ? value : 0;
    }

    private isValidProcessJob(job: AiDocumentProcessJobMessage): boolean {
        return Boolean(
            job?.fileId && job.storageKey && job.organizationId && job.ownerId
        );
    }

    private isValidDeleteJob(job: AiDocumentDeleteJobMessage): boolean {
        return Boolean(job?.fileId);
    }
}
