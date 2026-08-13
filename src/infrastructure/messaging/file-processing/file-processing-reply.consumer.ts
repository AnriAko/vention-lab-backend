import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';

import { FILE_PROCESSING_RESULTS_QUEUE } from '@shared/file-processing/constants';
import {
    isFileProcessStatus,
    type FileProcessResultMessage,
} from '@shared/file-processing/messages';
import { LoggerService } from '~/infrastructure/logging/logger.service';
import { RabbitmqService } from '~/infrastructure/messaging/rabbitmq.service';
import { FileProcessingResultService } from '~/modules/files/file-processing-result.service';

@Injectable()
export class FileProcessingReplyConsumer implements OnModuleInit {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly resultService: FileProcessingResultService,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.consume(FILE_PROCESSING_RESULTS_QUEUE, (msg) =>
            this.handleResult(msg)
        );
    }

    private async handleResult(msg: ConsumeMessage): Promise<void> {
        let payload: FileProcessResultMessage;

        try {
            payload = JSON.parse(
                msg.content.toString('utf8')
            ) as FileProcessResultMessage;
        } catch (error) {
            this.logger.error(
                `[FileProcessingReplyConsumer] invalid JSON: ${error instanceof Error ? error.message : String(error)}`
            );
            this.rabbitmq.ack(msg);
            return;
        }

        if (
            !payload?.fileId ||
            !payload.ownerId ||
            !isFileProcessStatus(payload.status)
        ) {
            this.logger.error(
                '[FileProcessingReplyConsumer] missing fileId/ownerId or invalid status'
            );
            this.rabbitmq.ack(msg);
            return;
        }

        try {
            await this.resultService.applyResult(payload);
            this.rabbitmq.ack(msg);
        } catch (error) {
            this.logger.error(
                `[FileProcessingReplyConsumer] apply failed fileId=${payload.fileId}: ${error instanceof Error ? error.message : String(error)}`
            );
            this.rabbitmq.nack(msg, true);
        }
    }
}
