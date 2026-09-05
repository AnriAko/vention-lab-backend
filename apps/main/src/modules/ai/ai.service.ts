import { Injectable } from '@nestjs/common';

import {
    GENERATION_EXCHANGE,
    GENERATION_REQUEST_ROUTING_KEY,
} from '@vention/generation-contract/constants';
import type { GenerationRequestMessage } from '@vention/generation-contract/types';
import { generationTopology } from '@vention/generation-contract';
import { LoggerService } from '@vention/shared-logger';
import { RabbitmqService } from '@vention/shared-rabbitmq';

@Injectable()
export class AiService {
    constructor(
        private readonly rabbitmq: RabbitmqService,
        private readonly logger: LoggerService
    ) {}

    async publishGenerationRequest(
        request: GenerationRequestMessage
    ): Promise<void> {
        await this.rabbitmq.assertTopology(generationTopology);

        const published = await this.rabbitmq.publish(
            GENERATION_EXCHANGE,
            GENERATION_REQUEST_ROUTING_KEY,
            request,
            {
                correlationId: request.requestId,
                messageId: request.requestId,
                type: GENERATION_REQUEST_ROUTING_KEY,
            }
        );

        if (!published) {
            throw new Error(
                `Failed to publish generation request requestId=${request.requestId}`
            );
        }

        this.logger.log(
            `[AiService] published generation request requestId=${request.requestId}`
        );
    }
}
