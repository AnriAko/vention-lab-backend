import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Ollama, type EmbedResponse } from 'ollama';

import { ollamaConfig } from '~/config/configuration/ollama.config';
import { LoggerService } from '~/shared/logger';

import {
    EmbeddingError,
    EmbeddingModelNotFoundError,
    EmbeddingProviderUnavailableError,
    InvalidEmbeddingResponseError,
} from './embedding.errors';
import type { EmbeddingProvider } from './embedding.provider';

@Injectable()
export class OllamaEmbeddingProvider implements EmbeddingProvider {
    private readonly client: Ollama;

    constructor(
        @Inject(ollamaConfig.KEY)
        private readonly config: ConfigType<typeof ollamaConfig>,
        private readonly logger: LoggerService
    ) {
        this.client = new Ollama({ host: this.config.host });
    }

    async embed(text: string): Promise<number[]> {
        const [embedding] = await this.embedBatch([text]);
        return embedding!;
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) {
            return [];
        }

        const startedAt = Date.now();

        this.logger.debug({
            message: 'embedding request started',
            model: this.config.embeddingModel,
            batchSize: texts.length,
        });

        try {
            const response = await this.client.embed({
                model: this.config.embeddingModel,
                input: texts.length === 1 ? texts[0]! : texts,
            });

            this.validateResponse(response, texts.length);

            this.logger.debug({
                message: 'embedding batch completed',
                model: this.config.embeddingModel,
                batchSize: texts.length,
                embeddings: response.embeddings.length,
                durationMs: Date.now() - startedAt,
            });

            return response.embeddings;
        } catch (error) {
            this.logger.error(
                {
                    message: 'embedding request failed',
                    model: this.config.embeddingModel,
                    batchSize: texts.length,
                    durationMs: Date.now() - startedAt,
                },
                error instanceof Error ? error.stack : undefined
            );

            throw this.mapError(error);
        }
    }

    private validateResponse(
        response: EmbedResponse,
        expectedCount: number
    ): void {
        if (!response?.embeddings || !Array.isArray(response.embeddings)) {
            throw new InvalidEmbeddingResponseError(
                'Ollama response missing embeddings array'
            );
        }

        if (response.embeddings.length !== expectedCount) {
            throw new InvalidEmbeddingResponseError(
                `Ollama returned ${response.embeddings.length} embeddings, expected ${expectedCount}`
            );
        }

        for (const embedding of response.embeddings) {
            if (!embedding || embedding.length === 0) {
                throw new InvalidEmbeddingResponseError(
                    'Ollama returned empty embedding'
                );
            }
        }
    }

    private mapError(error: unknown): Error {
        if (error instanceof EmbeddingError) {
            return error;
        }

        const message = error instanceof Error ? error.message : String(error);
        const code = this.resolveErrorCode(error);

        if (
            code === 'ECONNREFUSED' ||
            code === 'ENOTFOUND' ||
            code === 'ETIMEDOUT' ||
            /fetch failed|econnrefused|timeout/i.test(message)
        ) {
            return new EmbeddingProviderUnavailableError(message);
        }

        if (/model.*not found/i.test(message)) {
            return new EmbeddingModelNotFoundError(this.config.embeddingModel);
        }

        if (error instanceof Error) {
            return new EmbeddingError(message);
        }

        return new EmbeddingError('Unknown embedding error');
    }

    private resolveErrorCode(error: unknown): string | undefined {
        const directCode = (error as NodeJS.ErrnoException | undefined)?.code;
        if (directCode) {
            return directCode;
        }

        const cause = (error as { cause?: unknown } | undefined)?.cause;
        return (cause as NodeJS.ErrnoException | undefined)?.code;
    }
}
