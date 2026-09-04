import { Injectable } from '@nestjs/common';

import {
    FILE_PROCESS_EXCHANGE,
    FILE_PROCESS_RESULTS_QUEUE,
    FILE_PROCESS_ROUTING_KEY,
} from '@vention/file-process-contract/constants';
import type { FileProcessJobMessage } from '@vention/file-process-contract/types';
import { fileProcessTopology } from '@vention/file-process-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class FileProcessingPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishStorageFinalized(job: FileProcessJobMessage): Promise<void> {
        await this.rabbitmq.assertTopology(fileProcessTopology);

        const published = await this.rabbitmq.publish(
            FILE_PROCESS_EXCHANGE,
            FILE_PROCESS_ROUTING_KEY,
            job,
            {
                correlationId: job.fileId,
                replyTo: FILE_PROCESS_RESULTS_QUEUE,
                messageId: job.fileId,
                type: FILE_PROCESS_ROUTING_KEY,
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
