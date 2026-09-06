import { Module } from '@nestjs/common';

import { AiGenerationGateway } from './ai-generation/ai.generation.gateway';
import { AiGenerationService } from './ai-generation/ai.generation.service';

@Module({
    providers: [AiGenerationGateway, AiGenerationService],
    exports: [AiGenerationService],
})
export class AiModule {}
