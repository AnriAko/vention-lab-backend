import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { RmqRecordBuilder, type ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { AI_DOCUMENT_PROCESS_ROUTING_KEY } from '@vention/rag-contract/constants';
import type { AiDocumentProcessJobMessage } from '@vention/rag-contract/types';
import { aiDocumentTopology } from '@vention/rag-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class RagProcessingPublisher {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        @Inject('RAG_RMQ_CLIENT') private readonly client: ClientProxy,
        private readonly logger: LoggerService
    ) {}

    async publishStorageFinalized(
        job: AiDocumentProcessJobMessage
    ): Promise<void> {
        await this.rabbitmq.assertTopology(aiDocumentTopology);

        await firstValueFrom(
            this.client.emit(
                AI_DOCUMENT_PROCESS_ROUTING_KEY,
                new RmqRecordBuilder(job)
                    .setOptions({
                        messageId: job.fileId,
                        type: AI_DOCUMENT_PROCESS_ROUTING_KEY,
                    })
                    .build()
            )
        );

        this.logger.log(
            `[RagProcessingPublisher] published fileId=${job.fileId} storageKey=${job.storageKey}`
        );
    }
}
