import { Injectable } from '@nestjs/common';

import {
    RAG_DELETE_ROUTING_KEY,
    RAG_EXCHANGE,
} from '~/shared/rag-contract/constants';
import type { RagDeleteJobMessage } from '~/shared/rag-contract/types';
import { ragTopology } from '~/shared/rag-contract';
import { LoggerService } from '~/shared/logger';
import { RabbitmqService } from '~/shared/rabbitmq';

@Injectable()
export class RagDeletionPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishDelete(job: RagDeleteJobMessage): Promise<void> {
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
