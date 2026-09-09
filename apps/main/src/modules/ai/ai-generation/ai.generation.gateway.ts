import { UseInterceptors } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import {
    GENERATION_WS_CANCEL_EVENT,
    GENERATION_WS_CANCELLED_EVENT,
    GENERATION_WS_CHUNK_EVENT,
    GENERATION_WS_DONE_EVENT,
    GENERATION_WS_ERROR_EVENT,
    GENERATION_WS_NAMESPACE,
    GENERATION_WS_START_EVENT,
    type GenerationCancelledPayload,
    type GenerationChunkPayload,
    type GenerationDonePayload,
    type GenerationErrorPayload,
} from '@vention/generation-contract';

import type { AuthUser } from '~/common/security/auth.types';
import { WsAuthGuard } from '~/common/security/ws-security/ws-auth.guard';
import { WsOrganizationGuard } from '~/common/security/ws-security/ws-organization.guard';
import { WsRlsInterceptor } from '~/common/security/ws-security/ws-rls-interceptor';

import { AiGenerationService } from './ai.generation.service';
import { GenerationCancelRequestDto } from './requests/generation-cancel.request.dto';
import { GenerationStartRequestDto } from './requests/generation-start.request.dto';

const AI_WS_LOG_PREFIX = '[AiGenerationGateway]';

type AiGenerationSocketData = {
    user: AuthUser;
};

type AiGenerationClientEvents = {
    [GENERATION_WS_CHUNK_EVENT]: (payload: GenerationChunkPayload) => void;

    [GENERATION_WS_DONE_EVENT]: (payload: GenerationDonePayload) => void;

    [GENERATION_WS_ERROR_EVENT]: (payload: GenerationErrorPayload) => void;

    [GENERATION_WS_CANCELLED_EVENT]: (
        payload: GenerationCancelledPayload
    ) => void;
};

export type AiGenerationSocket = Socket<
    Record<string, never>,
    AiGenerationClientEvents,
    Record<string, never>,
    AiGenerationSocketData
>;

@WebSocketGateway({
    namespace: GENERATION_WS_NAMESPACE,
    cors: {
        origin: true,
        credentials: true,
    },
})
@UseInterceptors(WsRlsInterceptor)
export class AiGenerationGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    constructor(
        private readonly aiGenerationService: AiGenerationService,
        private readonly wsAuthGuard: WsAuthGuard,
        private readonly wsOrganizationGuard: WsOrganizationGuard
    ) {}

    async handleConnection(client: AiGenerationSocket): Promise<void> {
        try {
            await this.wsAuthGuard.authenticate(client);
            await this.wsOrganizationGuard.authorize(client);

            this.aiGenerationService.handleConnect(client);

            console.info(
                `${AI_WS_LOG_PREFIX} connected userId=${client.data.user.userId} socketId=${client.id}`
            );
        } catch {
            console.warn(`${AI_WS_LOG_PREFIX} rejected socketId=${client.id}`);
            client.disconnect(true);
        }
    }

    handleDisconnect(client: AiGenerationSocket): void {
        this.aiGenerationService.handleDisconnect(client);
    }

    @SubscribeMessage(GENERATION_WS_START_EVENT)
    async handleStart(
        @ConnectedSocket() client: AiGenerationSocket,
        @MessageBody() payload: GenerationStartRequestDto
    ): Promise<void> {
        console.info(
            `${AI_WS_LOG_PREFIX} generation:start socketId=${client.id} generationId=${payload.generationId} conversationId=${payload.conversationId ?? 'new'}`
        );

        await this.aiGenerationService.start(client, payload);
    }

    @SubscribeMessage(GENERATION_WS_CANCEL_EVENT)
    handleCancel(
        @ConnectedSocket() client: AiGenerationSocket,
        @MessageBody() payload: GenerationCancelRequestDto
    ): void {
        this.aiGenerationService.cancel(client, payload.generationId);
    }
}
