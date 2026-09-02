import { Injectable } from '@nestjs/common';

import {
    FILE_WORKER_DELETE_ROUTING_KEY,
    FILE_WORKER_EXCHANGE,
} from '~/shared/file-worker-contract/constants';
import type { FileDeleteJobMessage } from '~/shared/file-worker-contract/types';
import { fileWorkerTopology } from '~/shared/file-worker-contract';
import { LoggerService } from '~/shared/logger';
import { RabbitmqService } from '~/shared/rabbitmq';

@Injectable()
export class FileDeletionPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishDelete(job: FileDeleteJobMessage): Promise<void> {
        await this.rabbitmq.assertTopology(fileWorkerTopology);

        const published = await this.rabbitmq.publish(
            FILE_WORKER_EXCHANGE,
            FILE_WORKER_DELETE_ROUTING_KEY,
            job,
            {
                messageId: job.fileId,
                type: FILE_WORKER_DELETE_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish file delete job for fileId=${job.fileId}`
            );
        }

        this.logger.log(
            `[FileDeletionPublisher] published delete fileId=${job.fileId}`
        );
    }
}
