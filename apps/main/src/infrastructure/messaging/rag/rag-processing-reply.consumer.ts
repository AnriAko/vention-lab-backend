import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';

import {
    FileProcessStatus,
    isFileProcessStatus,
} from '@vention/file-process-contract/constants';
import type { FileProcessResultMessage } from '@vention/file-process-contract/types';
import {
    RAG_PROCESS_RESULTS_QUEUE,
    isRagProcessStatus,
} from '@vention/rag-contract/constants';
import type { RagProcessResultMessage } from '@vention/rag-contract/types';
import { ragTopology } from '@vention/rag-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';
import { FileProcessingResultService } from '~/modules/files/file-processing-result.service';

@Injectable()
export class RagProcessingReplyConsumer implements OnModuleInit {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly resultService: FileProcessingResultService,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.assertTopology(ragTopology);

        await this.rabbitmq.consume(RAG_PROCESS_RESULTS_QUEUE, (msg) =>
            this.handleResult(msg)
        );
    }

    private async handleResult(msg: ConsumeMessage): Promise<void> {
        let payload: RagProcessResultMessage;

        try {
            payload = JSON.parse(
                msg.content.toString('utf8')
            ) as RagProcessResultMessage;
        } catch (error) {
            this.logger.error(
                `[RagProcessingReplyConsumer] invalid JSON: ${error instanceof Error ? error.message : String(error)}`
            );
            this.rabbitmq.ack(msg);
            return;
        }

        if (
            !payload?.fileId ||
            !payload.ownerId ||
            !isRagProcessStatus(payload.status)
        ) {
            this.logger.error(
                '[RagProcessingReplyConsumer] missing fileId/ownerId or invalid status'
            );
            this.rabbitmq.ack(msg);
            return;
        }

        const normalized: FileProcessResultMessage = {
            fileId: payload.fileId,
            organizationId: payload.organizationId,
            ownerId: payload.ownerId,
            status: payload.status as unknown as FileProcessStatus,
            success: payload.success,
            error: payload.error,
            totals: null,
        };

        if (!isFileProcessStatus(normalized.status)) {
            this.rabbitmq.ack(msg);
            return;
        }

        try {
            await this.resultService.applyResult(normalized);
            this.rabbitmq.ack(msg);
        } catch (error) {
            this.logger.error(
                `[RagProcessingReplyConsumer] apply failed fileId=${payload.fileId}: ${error instanceof Error ? error.message : String(error)}`
            );
            this.rabbitmq.nack(msg, true);
        }
    }
}
