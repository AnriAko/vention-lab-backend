import { Injectable } from '@nestjs/common';

import {
    AI_DOCUMENT_DELETE_ROUTING_KEY,
    AI_DOCUMENT_EXCHANGE,
} from '@vention/rag-contract/constants';
import type { AiDocumentDeleteJobMessage } from '@vention/rag-contract/types';
import { aiDocumentTopology } from '@vention/rag-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class RagDeletionPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishDelete(job: AiDocumentDeleteJobMessage): Promise<void> {
        await this.rabbitmq.assertTopology(aiDocumentTopology);

        const published = await this.rabbitmq.publish(
            AI_DOCUMENT_EXCHANGE,
            AI_DOCUMENT_DELETE_ROUTING_KEY,
            job,
            {
                messageId: job.fileId,
                type: AI_DOCUMENT_DELETE_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish AI document delete job for fileId=${job.fileId}`
            );
        }

        this.logger.log(
            `[RagDeletionPublisher] published delete fileId=${job.fileId}`
        );
    }
}
