import { Injectable } from '@nestjs/common';

import {
    RAG_DELETE_ROUTING_KEY,
    RAG_EXCHANGE,
} from '@vention/rag-contract/constants';
import type { RagFileDeleteJobMessage } from '@vention/rag-contract/types';
import { ragTopology } from '@vention/rag-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class RagDeletionPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishDelete(job: RagFileDeleteJobMessage): Promise<void> {
        await this.rabbitmq.assertTopology(ragTopology);

        const published = await this.rabbitmq.publish(
            RAG_EXCHANGE,
            RAG_DELETE_ROUTING_KEY,
            job,
            {
                messageId: job.fileId,
                type: RAG_DELETE_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish RAG delete job for fileId=${job.fileId}`
            );
        }

        this.logger.log(
            `[RagDeletionPublisher] published delete fileId=${job.fileId}`
        );
    }
}
