import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';

import {
    AI_DOCUMENT_DELETE_RETRY_HEADER,
    AI_DOCUMENT_DELETE_ROUTING_KEY,
    AI_DOCUMENT_EXCHANGE,
    AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE,
    AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
    AI_DOCUMENT_PROCESS_RETRY_HEADER,
    AI_DOCUMENT_PROCESS_ROUTING_KEY,
} from '@vention/rag-contract/constants';
import { aiDocumentTopology } from '@vention/rag-contract';
import type {
    AiDocumentDeleteJobMessage,
    AiDocumentProcessJobMessage,
    AiDocumentProcessResultMessage,
} from '@vention/rag-contract/types';
import {
    copyHeaders,
    getCorrelationId,
    RabbitmqService,
} from '@vention/shared-rabbitmq';
import { LoggerService } from '@vention/shared-logger';

@Injectable()
export class AiDocumentPublisher implements OnModuleInit {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.assertTopology(aiDocumentTopology);
    }

    async publishProcessResult(
        result: AiDocumentProcessResultMessage,
        originalMessage: ConsumeMessage
    ): Promise<void> {
        const correlationId = getCorrelationId(originalMessage, result.fileId);
        const replyTo = originalMessage.properties.replyTo as unknown;

        if (typeof replyTo === 'string' && replyTo.length > 0) {
            this.logger.debug(
                `[AiDocumentPublisher] sending result to replyTo queue fileId=${result.fileId}`
            );

            const sent = await this.rabbitmq.sendToQueue(replyTo, result, {
                correlationId,
                type: AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
            });

            if (!sent) {
                throw new Error(
                    `Failed to send AI document result to replyTo fileId=${result.fileId}`
                );
            }

            return;
        }

        this.logger.debug(
            `[AiDocumentPublisher] publishing result to exchange fileId=${result.fileId}`
        );

        const published = await this.rabbitmq.publish(
            AI_DOCUMENT_PROCESS_RESULTS_EXCHANGE,
            AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
            result,
            {
                correlationId,
                type: AI_DOCUMENT_PROCESS_RESULTS_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish AI document result fileId=${result.fileId}`
            );
        }
    }

    async publishProcessRetry(
        job: AiDocumentProcessJobMessage,
        originalMessage: ConsumeMessage,
        nextRetryCount: number
    ): Promise<void> {
        this.logger.warn(
            `[AiDocumentPublisher] publishing process retry fileId=${job.fileId} retryCount=${nextRetryCount}`
        );

        const published = await this.rabbitmq.publish(
            AI_DOCUMENT_EXCHANGE,
            AI_DOCUMENT_PROCESS_ROUTING_KEY,
            {
                pattern: AI_DOCUMENT_PROCESS_ROUTING_KEY,
                data: job,
            },
            {
                type: AI_DOCUMENT_PROCESS_ROUTING_KEY,
                headers: {
                    ...copyHeaders(originalMessage.properties.headers),
                    [AI_DOCUMENT_PROCESS_RETRY_HEADER]: String(nextRetryCount),
                },
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish AI document process retry fileId=${job.fileId}`
            );
        }
    }

    async publishDeleteRetry(
        job: AiDocumentDeleteJobMessage,
        originalMessage: ConsumeMessage,
        nextRetryCount: number
    ): Promise<void> {
        this.logger.warn(
            `[AiDocumentPublisher] publishing delete retry fileId=${job.fileId} retryCount=${nextRetryCount}`
        );

        const published = await this.rabbitmq.publish(
            AI_DOCUMENT_EXCHANGE,
            AI_DOCUMENT_DELETE_ROUTING_KEY,
            {
                pattern: AI_DOCUMENT_DELETE_ROUTING_KEY,
                data: job,
            },
            {
                type: AI_DOCUMENT_DELETE_ROUTING_KEY,
                headers: {
                    ...copyHeaders(originalMessage.properties.headers),
                    [AI_DOCUMENT_DELETE_RETRY_HEADER]: String(nextRetryCount),
                },
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish AI document delete retry fileId=${job.fileId}`
            );
        }
    }
}
