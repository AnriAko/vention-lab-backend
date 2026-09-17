import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import { io, type Socket as RagSocket } from 'socket.io-client';

import {
    GENERATION_WS_CANCEL_EVENT,
    GENERATION_WS_CANCELLED_EVENT,
    GENERATION_WS_CHUNK_EVENT,
    GENERATION_WS_DONE_EVENT,
    GENERATION_WS_ERROR_EVENT,
    GENERATION_WS_NAMESPACE,
    GENERATION_WS_START_EVENT,
    type GenerationCancelPayload,
    type GenerationCancelledPayload,
    type GenerationChunkPayload,
    type GenerationDonePayload,
    type GenerationErrorPayload,
    type GenerationStartPayload,
} from '@vention/generation-contract';

import type { ConfigType } from '@nestjs/config';

import { AiConversationService } from '~/modules/ai/ai-conversation/ai-conversation.service';
import { AiConversationMessageService } from '~/modules/ai/ai-conversation-message/ai-conversation-message.service';

import type { AiGenerationSocket } from './ai.generation.gateway';
import type { GenerationStartRequest } from './requests/generation-start.request.dto';

import { GenerationChunkResponse } from '~/modules/ai/ai-generation/response/generation-chunk.response';
import { GenerationDoneResponse } from '~/modules/ai/ai-generation/response/generation-done.response';
import { GenerationErrorResponse } from '~/modules/ai/ai-generation/response/generation-error.response';
import { GenerationCancelledResponse } from '~/modules/ai/ai-generation/response/generation-cancelled.response';

import type { AuthUser } from '~/common/security/auth.types';
import { WsRlsContext } from '~/common/security/ws-security/ws-rls-interceptor';

import { ragConfig } from '~/config/configuration/rag.config';
import { LoggerService } from '@vention/shared-logger';

import { toGenerationHistory } from '~/modules/ai/ai-generation/ai.generation.utils';

type ClientGeneration = {
    client: AiGenerationSocket;
    user: AuthUser;
    organizationId: string;
    conversationId: string;
    assistantContent: string;
};

@Injectable()
export class AiGenerationService implements OnModuleDestroy {
    private ragSocket?: RagSocket;

    private readonly connectedClients = new Set<string>();

    private readonly generations = new Map<string, ClientGeneration>();

    constructor(
        private readonly aiConversationService: AiConversationService,
        private readonly aiMessageService: AiConversationMessageService,
        private readonly wsRlsContext: WsRlsContext,
        private readonly logger: LoggerService,

        @Inject(ragConfig.KEY)
        private readonly ragConf: ConfigType<typeof ragConfig>
    ) {}

    handleConnect(client: AiGenerationSocket): void {
        this.connectedClients.add(client.id);

        this.ensureRagSocket();
    }

    handleDisconnect(client: AiGenerationSocket): void {
        const generationsToCancel: string[] = [];

        for (const [generationId, generation] of this.generations) {
            if (generation.client.id === client.id) {
                generationsToCancel.push(generationId);
            }
        }

        for (const generationId of generationsToCancel) {
            this.ragSocket?.emit(GENERATION_WS_CANCEL_EVENT, {
                generationId,
            } satisfies GenerationCancelPayload);

            this.generations.delete(generationId);
        }

        this.connectedClients.delete(client.id);

        if (this.connectedClients.size === 0) {
            this.disconnectRagSocket();
        }
    }

    async start(
        client: AiGenerationSocket,
        payload: GenerationStartRequest
    ): Promise<void> {
        const organizationId = this.getOrganizationId(client);

        let conversationId = payload.conversationId;

        if (conversationId) {
            await this.aiConversationService.findById(conversationId);
        } else {
            const conversation = await this.aiConversationService.create();

            conversationId = conversation.id;
        }

        const history =
            await this.aiMessageService.getConversationHistory(conversationId);

        await this.aiMessageService.createUserMessage(
            conversationId,
            payload.query
        );

        const generation: ClientGeneration = {
            client,
            user: client.data.user,
            organizationId,
            conversationId,
            assistantContent: '',
        };

        this.generations.set(payload.generationId, generation);

        const ragPayload: GenerationStartPayload = {
            generationId: payload.generationId,
            conversationId,
            query: payload.query,
            organizationId,
            history: toGenerationHistory(history),
            options: payload.options,
        };

        this.logger.log(
            `[AiGenerationService] sending generation:start to RAG generationId=${payload.generationId}`
        );

        this.getRagSocket().emit(GENERATION_WS_START_EVENT, ragPayload);
    }

    cancel(client: AiGenerationSocket, generationId: string): void {
        const generation = this.generations.get(generationId);

        if (!generation) {
            return;
        }

        if (generation.client.id !== client.id) {
            return;
        }

        this.getRagSocket().emit(GENERATION_WS_CANCEL_EVENT, {
            generationId,
        } satisfies GenerationCancelPayload);
    }

    onModuleDestroy(): void {
        this.disconnectRagSocket();

        this.generations.clear();
        this.connectedClients.clear();
    }

    private ensureRagSocket(): RagSocket {
        if (this.ragSocket) {
            return this.ragSocket;
        }

        const socket = io(`${this.ragConf.wsUrl}${GENERATION_WS_NAMESPACE}`, {
            transports: ['websocket'],
            reconnection: true,
        });

        this.ragSocket = socket;

        socket.on('connect', () => {
            this.logger.log(
                `[AiGenerationService] connected to RAG websocket socketId=${socket.id}`
            );
        });

        socket.on('connect_error', (error: Error) => {
            this.logger.error(
                `[AiGenerationService] RAG websocket connection failed: ${error.message}`
            );
        });

        socket.on('disconnect', (reason) => {
            this.logger.warn(
                `[AiGenerationService] disconnected from RAG websocket reason=${reason}`
            );
        });

        this.registerRagListeners(socket);

        return socket;
    }

    private disconnectRagSocket(): void {
        if (!this.ragSocket) {
            return;
        }

        this.ragSocket.disconnect();
        this.ragSocket = undefined;
    }

    private registerRagListeners(socket: RagSocket): void {
        socket.on(
            GENERATION_WS_CHUNK_EVENT,
            (payload: GenerationChunkPayload) => {
                const generation = this.generations.get(payload.generationId);

                if (!generation) {
                    return;
                }

                generation.assistantContent += payload.chunk;

                const response = GenerationChunkResponse.schema.parse({
                    generationId: payload.generationId,
                    chunk: payload.chunk,
                });

                generation.client.emit(GENERATION_WS_CHUNK_EVENT, response);
            }
        );

        socket.on(
            GENERATION_WS_DONE_EVENT,
            async (payload: GenerationDonePayload) => {
                const generation = this.generations.get(payload.generationId);

                if (!generation) {
                    return;
                }

                try {
                    await this.wsRlsContext.runAuthenticated(
                        generation.user,
                        () => this.saveAssistantMessage(generation)
                    );

                    const response = GenerationDoneResponse.schema.parse({
                        generationId: payload.generationId,
                    });

                    generation.client.emit(GENERATION_WS_DONE_EVENT, response);
                } catch (error) {
                    this.logger.error(
                        `[AiGenerationService] failed to save assistant message generationId=${payload.generationId}: ${
                            error instanceof Error
                                ? error.message
                                : String(error)
                        }`
                    );

                    generation.client.emit(GENERATION_WS_ERROR_EVENT, {
                        generationId: payload.generationId,
                        error: 'Failed to save generated response',
                    });
                } finally {
                    this.cleanupGeneration(payload.generationId);
                }
            }
        );

        socket.on(
            GENERATION_WS_ERROR_EVENT,
            (payload: GenerationErrorPayload) => {
                const generation = this.generations.get(payload.generationId);

                if (!generation) {
                    return;
                }

                const response = GenerationErrorResponse.schema.parse({
                    generationId: payload.generationId,
                    error: payload.error,
                });

                generation.client.emit(GENERATION_WS_ERROR_EVENT, response);

                this.cleanupGeneration(payload.generationId);
            }
        );

        socket.on(
            GENERATION_WS_CANCELLED_EVENT,
            async (payload: GenerationCancelledPayload) => {
                const generation = this.generations.get(payload.generationId);

                if (!generation) {
                    return;
                }

                try {
                    await this.wsRlsContext.runAuthenticated(
                        generation.user,
                        () => this.saveAssistantMessage(generation)
                    );

                    const response = GenerationCancelledResponse.schema.parse({
                        generationId: payload.generationId,
                    });

                    generation.client.emit(
                        GENERATION_WS_CANCELLED_EVENT,
                        response
                    );
                } catch (error) {
                    this.logger.error(
                        `[AiGenerationService] failed to save cancelled assistant message generationId=${payload.generationId}: ${
                            error instanceof Error
                                ? error.message
                                : String(error)
                        }`
                    );

                    generation.client.emit(GENERATION_WS_ERROR_EVENT, {
                        generationId: payload.generationId,
                        error: 'Failed to save generated response',
                    });
                } finally {
                    this.cleanupGeneration(payload.generationId);
                }
            }
        );
    }

    private async saveAssistantMessage(
        generation: ClientGeneration
    ): Promise<void> {
        const content = generation.assistantContent.trim();

        if (!content) {
            return;
        }

        await this.aiMessageService.createAssistantMessage(
            generation.conversationId,
            content
        );
    }

    private cleanupGeneration(generationId: string): void {
        this.generations.delete(generationId);
    }

    private getOrganizationId(client: AiGenerationSocket): string {
        const user = client.data.user;

        if (!user.organizationId) {
            throw new Error('Organization ID is not available');
        }

        return user.organizationId;
    }

    private getRagSocket(): RagSocket {
        return this.ensureRagSocket();
    }
}
