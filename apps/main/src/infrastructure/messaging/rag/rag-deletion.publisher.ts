import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { RmqRecordBuilder, type ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { AI_DOCUMENT_DELETE_ROUTING_KEY } from '@vention/rag-contract/constants';
import type { AiDocumentDeleteJobMessage } from '@vention/rag-contract/types';
import { aiDocumentTopology } from '@vention/rag-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class RagDeletionPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        @Inject('RAG_RMQ_CLIENT') private readonly client: ClientProxy,
        private readonly logger: LoggerService
    ) {}

    async publishDelete(job: AiDocumentDeleteJobMessage): Promise<void> {
        await this.rabbitmq.assertTopology(aiDocumentTopology);

        await firstValueFrom(
            this.client.emit(
                AI_DOCUMENT_DELETE_ROUTING_KEY,
                new RmqRecordBuilder(job)
                    .setOptions({
                        messageId: job.fileId,
                        type: AI_DOCUMENT_DELETE_ROUTING_KEY,
                    })
                    .build()
            )
        );

        this.logger.log(
            `[RagDeletionPublisher] published delete fileId=${job.fileId}`
        );
    }
}
