import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { Channel, ConsumeMessage } from 'amqplib';

import {
    FILE_PROCESS_EXCHANGE,
    FILE_PROCESS_MAX_RETRIES,
    FILE_PROCESS_RETRY_HEADER,
    FILE_PROCESS_ROUTING_KEY,
} from '@vention/file-process-contract/constants';
import type { FileProcessJobMessage } from '@vention/file-process-contract/types';
import { LoggerService } from '@vention/shared-logger';
import {
    RabbitmqService,
    copyHeaders,
    getCorrelationId,
    getRetryCount,
} from '@vention/shared-rabbitmq';

import { TransientProcessingError } from './file-process.errors';
import { FileProcessService } from './file-process.service';
import { FileProcessStatusPublisher } from './file-process.result.publisher';

@Controller()
export class FileProcessController {
    constructor(
        private readonly fileProcessService: FileProcessService,
        private readonly statusPublisher: FileProcessStatusPublisher,
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    @EventPattern(FILE_PROCESS_ROUTING_KEY)
    async handleProcess(
        @Payload() job: FileProcessJobMessage,
        @Ctx() context: RmqContext
    ): Promise<void> {
        const message = context.getMessage() as ConsumeMessage;
        const channel = context.getChannelRef() as Channel;

        if (!this.isValidJob(job)) {
            this.logger.error(
                '[FileProcessController] Process job missing required fields'
            );
            channel.ack(message);
            return;
        }

        const retryCount = getRetryCount(message, FILE_PROCESS_RETRY_HEADER);

        try {
            await this.statusPublisher.publish(
                this.fileProcessService.processingResult(job)
            );

            const result = await this.fileProcessService.processJob(job);

            await this.statusPublisher.publish(result);

            channel.ack(message);
        } catch (error) {
            await this.handleFailure(job, message, channel, retryCount, error);
        }
    }

    private async handleFailure(
        job: FileProcessJobMessage,
        message: ConsumeMessage,
        channel: Channel,
        retryCount: number,
        error: unknown
    ): Promise<void> {
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        if (this.fileProcessService.isPermanentError(error)) {
            this.logger.error(
                `[FileProcessController] permanent failure fileId=${job.fileId}: ${errorMessage}`
            );

            await this.statusPublisher.publish(
                this.fileProcessService.failedResult(job, errorMessage)
            );

            channel.ack(message);
            return;
        }

        if (!(error instanceof TransientProcessingError)) {
            this.logger.error(
                `[FileProcessController] unexpected error fileId=${job.fileId}: ${errorMessage}`
            );
        }

        if (retryCount + 1 >= FILE_PROCESS_MAX_RETRIES) {
            this.logger.error(
                `[FileProcessController] retry exhausted fileId=${job.fileId} retries=${retryCount}`
            );

            await this.statusPublisher.publish(
                this.fileProcessService.failedResult(
                    job,
                    `Processing failed after retries: ${errorMessage}`
                )
            );

            channel.nack(message, false, false);
            return;
        }

        const nextRetry = retryCount + 1;

        this.logger.warn(
            `[FileProcessController] transient failure fileId=${job.fileId} retry=${nextRetry}`
        );

        await this.rabbitmq.publish(
            FILE_PROCESS_EXCHANGE,
            FILE_PROCESS_ROUTING_KEY,
            job,
            {
                correlationId: getCorrelationId(message, job.fileId),
                type: FILE_PROCESS_ROUTING_KEY,
                headers: {
                    ...copyHeaders(message.properties.headers),
                    [FILE_PROCESS_RETRY_HEADER]: nextRetry,
                },
            }
        );

        channel.ack(message);
    }

    private isValidJob(job: FileProcessJobMessage): boolean {
        return Boolean(
            job?.fileId && job.storageKey && job.organizationId && job.ownerId
        );
    }
}
