import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Ollama } from 'ollama';
import type { AbortableAsyncIterator, ChatResponse } from 'ollama';

import { LoggerService } from '@vention/shared-logger';

import { ollamaConfig } from '~/config/configuration/ollama.config';

import type {
    GenerationProvider,
    GenerationRequest,
} from './generation.provider';

@Injectable()
export class OllamaGenerationProvider implements GenerationProvider {
    private readonly client: Ollama;

    private readonly streams = new Map<
        string,
        AbortableAsyncIterator<ChatResponse>
    >();

    constructor(
        @Inject(ollamaConfig.KEY)
        private readonly config: ConfigType<typeof ollamaConfig>,
        private readonly logger: LoggerService
    ) {
        this.client = new Ollama({
            host: this.config.host,
        });
    }

    async *generate(request: GenerationRequest): AsyncIterable<string> {
        const { generationId, messages, options } = request;

        const startedAt = Date.now();

        this.logger.debug({
            message: 'generation request started',
            generationId,
            model: this.config.generationModel,
            messages: messages.length,
        });

        try {
            const stream = await this.client.chat({
                model: this.config.generationModel,
                messages,
                stream: true,
                options: {
                    temperature: options?.temperature,
                },
            });

            this.streams.set(generationId, stream);

            for await (const chunk of stream) {
                const content = chunk.message?.content;

                if (content) {
                    yield content;
                }
            }

            this.logger.debug({
                message: 'generation request completed',
                generationId,
                model: this.config.generationModel,
                durationMs: Date.now() - startedAt,
            });
        } catch (error) {
            this.logger.error(
                {
                    message: 'generation request failed',
                    generationId,
                    model: this.config.generationModel,
                    durationMs: Date.now() - startedAt,
                },
                error instanceof Error ? error.stack : undefined
            );

            throw this.mapError(error);
        } finally {
            this.streams.delete(generationId);
        }
    }

    cancel(generationId: string): void {
        const stream = this.streams.get(generationId);

        if (!stream) {
            this.logger.debug({
                message: 'generation stream not found',
                generationId,
            });

            return;
        }

        stream.abort();

        this.logger.debug({
            message: 'generation cancellation requested',
            generationId,
        });
    }

    private mapError(error: unknown): Error {
        const message = error instanceof Error ? error.message : String(error);

        return new Error(`Generation provider error: ${message}`);
    }
}
