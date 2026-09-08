import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';

import {
    AI_DOCUMENT_DELETE_RETRY_HEADER,
    AI_DOCUMENT_DELETE_ROUTING_KEY,
    AI_DOCUMENT_PROCESS_RETRY_HEADER,
    AI_DOCUMENT_PROCESS_ROUTING_KEY,
} from '@vention/rag-contract/constants';

import type {
    AiDocumentDeleteJobMessage,
    AiDocumentProcessJobMessage,
} from '@vention/rag-contract/types';

import { LoggerService } from '@vention/shared-logger';
import { getRetryCount } from '@vention/shared-rabbitmq';

import { AiDocumentErrorHandler } from './ai-document.error-handler';
import { AiDocumentService } from './ai-document.service';
import { AiDocumentPublisher } from './ai-document.publisher';

@Controller()
export class AiDocumentController {
    constructor(
        private readonly aiDocumentService: AiDocumentService,
        private readonly publisher: AiDocumentPublisher,
        private readonly errorHandler: AiDocumentErrorHandler,
        private readonly logger: LoggerService
    ) {}

    @EventPattern(AI_DOCUMENT_PROCESS_ROUTING_KEY)
    async handleProcess(
        @Payload() job: AiDocumentProcessJobMessage,
        @Ctx() context: RmqContext
    ): Promise<void> {
        const message = context.getMessage() as ConsumeMessage;
        const channel = context.getChannelRef() as Channel;

        this.logger.log(
            `[AiDocumentController] received event routingKey=${AI_DOCUMENT_PROCESS_ROUTING_KEY} fileId=${job?.fileId ?? 'unknown'}`
        );

        if (!this.isValidProcessJob(job)) {
            this.logger.error(
                '[AiDocumentController] Process job missing required fields'
            );

            channel.ack(message);
            return;
        }

        const retryCount = getRetryCount(
            message,
            AI_DOCUMENT_PROCESS_RETRY_HEADER
        );

        try {
            await this.publisher.publishProcessResult(
                this.aiDocumentService.processingResult(job),
                message
            );

            const result = await this.aiDocumentService.processJob(job);

            await this.publisher.publishProcessResult(result, message);

            this.logger.log(
                `[AiDocumentController] process completed fileId=${job.fileId} status=${result.status}`
            );

            channel.ack(message);
        } catch (error) {
            await this.errorHandler.handleProcessFailure({
                job,
                message,
                channel,
                retryCount,
                error,
            });
        }
    }

    @EventPattern(AI_DOCUMENT_DELETE_ROUTING_KEY)
    async handleDelete(
        @Payload() job: AiDocumentDeleteJobMessage,
        @Ctx() context: RmqContext
    ): Promise<void> {
        const message = context.getMessage() as ConsumeMessage;
        const channel = context.getChannelRef() as Channel;

        this.logger.log(
            `[AiDocumentController] received event routingKey=${AI_DOCUMENT_DELETE_ROUTING_KEY} fileId=${job?.fileId ?? 'unknown'}`
        );

        if (!this.isValidDeleteJob(job)) {
            this.logger.error(
                '[AiDocumentController] Delete job missing required fields'
            );

            channel.ack(message);
            return;
        }

        const retryCount = getRetryCount(
            message,
            AI_DOCUMENT_DELETE_RETRY_HEADER
        );

        try {
            await this.aiDocumentService.deleteJob(job);

            this.logger.log(
                `[AiDocumentController] delete completed fileId=${job.fileId}`
            );

            channel.ack(message);
        } catch (error) {
            await this.errorHandler.handleDeleteFailure({
                job,
                message,
                channel,
                retryCount,
                error,
            });
        }
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
