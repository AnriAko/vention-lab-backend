import { Injectable } from '@nestjs/common';

import {
    RAG_EXCHANGE,
    RAG_PROCESS_RESULTS_QUEUE,
    RAG_PROCESS_ROUTING_KEY,
} from '@vention/rag-contract/constants';
import type { RagProcessJobMessage } from '@vention/rag-contract/types';
import { ragTopology } from '@vention/rag-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class RagProcessingPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishStorageFinalized(job: RagProcessJobMessage): Promise<void> {
        await this.rabbitmq.assertTopology(ragTopology);

        const published = await this.rabbitmq.publish(
            RAG_EXCHANGE,
            RAG_PROCESS_ROUTING_KEY,
            job,
            {
                correlationId: job.fileId,
                replyTo: RAG_PROCESS_RESULTS_QUEUE,
                messageId: job.fileId,
                type: RAG_PROCESS_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish RAG process job for fileId=${job.fileId}`
            );
        }

        this.logger.log(
            `[RagProcessingPublisher] published fileId=${job.fileId} storageKey=${job.storageKey}`
        );
    }
}
