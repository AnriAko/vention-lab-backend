import { Injectable } from '@nestjs/common';

import {
    FILE_PROCESSING_EXCHANGE,
    FILE_PROCESSING_RESULTS_QUEUE,
    FILE_PROCESSING_ROUTING_KEY,
} from '@shared/file-processing/constants';
import type { FileProcessJobMessage } from '@shared/file-processing/messages';
import { LoggerService } from '~/infrastructure/logging/logger.service';
import { RabbitmqService } from '~/infrastructure/messaging/rabbitmq.service';

@Injectable()
export class FileProcessingPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishStorageFinalized(job: FileProcessJobMessage): Promise<void> {
        const published = await this.rabbitmq.publish(
            FILE_PROCESSING_EXCHANGE,
            FILE_PROCESSING_ROUTING_KEY,
            job,
            {
                correlationId: job.fileId,
                replyTo: FILE_PROCESSING_RESULTS_QUEUE,
                messageId: job.fileId,
                type: FILE_PROCESSING_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish file process job for fileId=${job.fileId}`
            );
        }

        this.logger.log(
            `[FileProcessingPublisher] published fileId=${job.fileId} storageKey=${job.storageKey}`
        );
    }
}
