import { Module } from '@nestjs/common';

import { GENERATION_PROVIDER } from './generation.provider';
import { GenerationService } from './generation.service';
import { OllamaGenerationProvider } from './ollama-generation.provider';
import { GenerationGateway } from './generation.gateway';

import { EmbeddingModule } from '~/infrastructure/embedding/embedding.module';
import { QdrantDocumentsModule } from '~/infrastructure/qdrant/qdrant.module';

@Module({
    imports: [EmbeddingModule, QdrantDocumentsModule],
    providers: [
        OllamaGenerationProvider,
        {
            provide: GENERATION_PROVIDER,
            useExisting: OllamaGenerationProvider,
        },
        GenerationService,
        GenerationGateway,
    ],
    exports: [GenerationService],
})
export class GenerationModule {}
