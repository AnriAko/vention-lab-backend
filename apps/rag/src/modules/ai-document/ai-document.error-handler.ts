import { Injectable } from '@nestjs/common';
import type { Channel, ConsumeMessage } from 'amqplib';

import {
    AI_DOCUMENT_DELETE_MAX_RETRIES,
    AI_DOCUMENT_PROCESS_MAX_RETRIES,
} from '@vention/rag-contract/constants';

import type {
    AiDocumentDeleteJobMessage,
    AiDocumentProcessJobMessage,
} from '@vention/rag-contract/types';

import { LoggerService } from '@vention/shared-logger';

import {
    TransientAiDocumentError,
    TransientDeleteError,
} from './ai-document.errors';
import { AiDocumentService } from './ai-document.service';
import { AiDocumentPublisher } from './ai-document.publisher';

@Injectable()
export class AiDocumentErrorHandler {
    constructor(
        private readonly aiDocumentService: AiDocumentService,
        private readonly publisher: AiDocumentPublisher,
        private readonly logger: LoggerService
    ) {}

    async handleProcessFailure({
        job,
        message,
        channel,
        retryCount,
        error,
    }: {
        job: AiDocumentProcessJobMessage;
        message: ConsumeMessage;
        channel: Channel;
        retryCount: number;
        error: unknown;
    }): Promise<void> {
        const errorMessage = this.getErrorMessage(error);

        if (this.aiDocumentService.isPermanentProcessError(error)) {
            await this.publisher.publishProcessResult(
                this.aiDocumentService.failedResult(job, errorMessage),
                message
            );

            channel.ack(message);
            return;
        }

        if (error instanceof TransientAiDocumentError) {
            this.logger.warn(
                `[AiDocumentErrorHandler] transient process failure fileId=${job.fileId}: ${errorMessage}`
            );
        } else {
            this.logger.error(
                `[AiDocumentErrorHandler] unexpected process error fileId=${job.fileId}: ${errorMessage}`
            );
        }

        if (retryCount + 1 >= AI_DOCUMENT_PROCESS_MAX_RETRIES) {
            this.logger.error(
                `[AiDocumentErrorHandler] process retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );

            await this.publisher.publishProcessResult(
                this.aiDocumentService.failedResult(
                    job,
                    `Processing failed after retries: ${errorMessage}`
                ),
                message
            );

            channel.nack(message, false, false);
            return;
        }

        const nextRetry = retryCount + 1;

        this.logger.warn(
            `[AiDocumentErrorHandler] transient process retry fileId=${job.fileId} retry=${nextRetry}`
        );

        await this.publisher.publishProcessRetry(job, message, nextRetry);

        channel.ack(message);
    }

    async handleDeleteFailure({
        job,
        message,
        channel,
        retryCount,
        error,
    }: {
        job: AiDocumentDeleteJobMessage;
        message: ConsumeMessage;
        channel: Channel;
        retryCount: number;
        error: unknown;
    }): Promise<void> {
        const errorMessage = this.getErrorMessage(error);

        if (this.aiDocumentService.isPermanentDeleteError(error)) {
            this.logger.error(
                `[AiDocumentErrorHandler] permanent delete error fileId=${job.fileId}: ${errorMessage}`
            );

            channel.ack(message);
            return;
        }

        if (!(error instanceof TransientDeleteError)) {
            this.logger.error(
                `[AiDocumentErrorHandler] unexpected delete error fileId=${job.fileId}: ${errorMessage}`
            );
        }

        if (retryCount + 1 >= AI_DOCUMENT_DELETE_MAX_RETRIES) {
            this.logger.error(
                `[AiDocumentErrorHandler] delete retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );

            channel.nack(message, false, false);
            return;
        }

        const nextRetry = retryCount + 1;

        this.logger.warn(
            `[AiDocumentErrorHandler] transient delete failure fileId=${job.fileId} retry=${nextRetry}`
        );

        await this.publisher.publishDeleteRetry(job, message, nextRetry);

        channel.ack(message);
    }

    private getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }
}
