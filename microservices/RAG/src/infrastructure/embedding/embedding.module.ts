import { Module } from '@nestjs/common';

import { EMBEDDING_PROVIDER } from './embedding.provider';
import { EmbeddingService } from './embedding.service';
import { OllamaEmbeddingProvider } from './ollama-embedding.provider';

@Module({
    providers: [
        OllamaEmbeddingProvider,
        {
            provide: EMBEDDING_PROVIDER,
            useExisting: OllamaEmbeddingProvider,
        },
        EmbeddingService,
    ],
    exports: [EmbeddingService],
})
export class EmbeddingModule {}
