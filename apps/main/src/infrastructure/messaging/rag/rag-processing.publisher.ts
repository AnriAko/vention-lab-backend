import { Injectable } from '@nestjs/common';

import {
    AI_DOCUMENT_EXCHANGE,
    AI_DOCUMENT_PROCESS_RESULTS_QUEUE,
    AI_DOCUMENT_PROCESS_ROUTING_KEY,
} from '@vention/rag-contract/constants';
import type { AiDocumentProcessJobMessage } from '@vention/rag-contract/types';
import { aiDocumentTopology } from '@vention/rag-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class RagProcessingPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishStorageFinalized(
        job: AiDocumentProcessJobMessage
    ): Promise<void> {
        await this.rabbitmq.assertTopology(aiDocumentTopology);

        const published = await this.rabbitmq.publish(
            AI_DOCUMENT_EXCHANGE,
            AI_DOCUMENT_PROCESS_ROUTING_KEY,
            job,
            {
                correlationId: job.fileId,
                replyTo: AI_DOCUMENT_PROCESS_RESULTS_QUEUE,
                messageId: job.fileId,
                type: AI_DOCUMENT_PROCESS_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish AI document process job for fileId=${job.fileId}`
            );
        }

        this.logger.log(
            `[RagProcessingPublisher] published fileId=${job.fileId} storageKey=${job.storageKey}`
        );
    }
}
