import { Injectable, OnModuleInit } from '@nestjs/common';

import { fileProcessTopology } from '@vention/file-process-contract';
import {
    FILE_PROCESS_RESULTS_EXCHANGE,
    FILE_PROCESS_RESULTS_ROUTING_KEY,
} from '@vention/file-process-contract/constants';
import type { FileProcessResultMessage } from '@vention/file-process-contract/types';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class FileProcessStatusPublisher implements OnModuleInit {
    constructor(private readonly rabbitmq: RabbitmqService) {}

    async onModuleInit(): Promise<void> {
        await this.rabbitmq.assertTopology(fileProcessTopology);
    }

    async publish(result: FileProcessResultMessage): Promise<void> {
        const published = await this.rabbitmq.publish(
            FILE_PROCESS_RESULTS_EXCHANGE,
            FILE_PROCESS_RESULTS_ROUTING_KEY,
            result,
            { correlationId: result.fileId }
        );

        if (!published) {
            throw new Error(
                `Failed to publish file process result fileId=${result.fileId}`
            );
        }
    }
}
