import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import {
    GENERATION_WS_HEALTH_CHECK_EVENT,
    GENERATION_WS_CANCEL_EVENT,
    GENERATION_WS_CANCELLED_EVENT,
    GENERATION_WS_CHUNK_EVENT,
    GENERATION_WS_DONE_EVENT,
    GENERATION_WS_ERROR_EVENT,
    GENERATION_WS_START_EVENT,
    type GenerationCancelPayload,
    type GenerationStartPayload,
} from '@vention/generation-contract';
import type { HealthCheckResult } from '@vention/health-contract';
import { LoggerService } from '@vention/shared-logger';

import { GenerationService } from './generation.service';

@WebSocketGateway({
    namespace: '/ai',
})
export class GenerationGateway {
    constructor(
        private readonly generationService: GenerationService,
        private readonly logger: LoggerService
    ) {}

    handleConnection(client: Socket): void {
        this.logger.log(
            `[GenerationGateway] websocket connected clientId=${client.id}`
        );
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(
            `[GenerationGateway] websocket disconnected clientId=${client.id}`
        );
    }

    @SubscribeMessage(GENERATION_WS_HEALTH_CHECK_EVENT)
    handleHealthCheck(): HealthCheckResult {
        return { status: 'up', service: 'generation' };
    }

    @SubscribeMessage(GENERATION_WS_START_EVENT)
    async handleStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: GenerationStartPayload
    ): Promise<void> {
        this.logger.log(
            `[GenerationGateway] received websocket event=${GENERATION_WS_START_EVENT} clientId=${client.id} generationId=${payload?.generationId ?? 'unknown'}`
        );

        try {
            for await (const chunk of this.generationService.generate(
                payload.generationId,
                payload.query,
                payload.organizationId,
                payload.history ?? [],
                payload.options
            )) {
                client.emit(GENERATION_WS_CHUNK_EVENT, {
                    generationId: payload.generationId,
                    chunk,
                });
            }

            client.emit(GENERATION_WS_DONE_EVENT, {
                generationId: payload.generationId,
            });
        } catch (error) {
            client.emit(GENERATION_WS_ERROR_EVENT, {
                generationId: payload.generationId,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Generation failed',
            });
        }
    }

    @SubscribeMessage(GENERATION_WS_CANCEL_EVENT)
    handleCancel(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: GenerationCancelPayload
    ): void {
        this.logger.log(
            `[GenerationGateway] received websocket event=${GENERATION_WS_CANCEL_EVENT} clientId=${client.id} generationId=${payload?.generationId ?? 'unknown'}`
        );

        this.generationService.cancel(payload.generationId);

        client.emit(GENERATION_WS_CANCELLED_EVENT, {
            generationId: payload.generationId,
        });
    }
}
