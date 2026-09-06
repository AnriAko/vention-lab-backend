import { Module } from '@nestjs/common';

import { GENERATION_PROVIDER } from './generation.provider';
import { GenerationService } from './generation.service';
import { OllamaGenerationProvider } from './ollama-generation.provider';

@Module({
    providers: [
        OllamaGenerationProvider,
        {
            provide: GENERATION_PROVIDER,
            useExisting: OllamaGenerationProvider,
        },
        GenerationService,
    ],
    exports: [GenerationService],
})
export class GenerationModule {}
