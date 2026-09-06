import { Module } from '@nestjs/common';

import { AiGenerationController } from './ai-generation/ai.generation.controller';
import { AiGateway } from './ai-generation/ai.generation.gateway';
import { AiGenerationService } from './ai-generation/ai.generation.service';

@Module({
    controllers: [AiGenerationController],
    providers: [AiGenerationService, AiGateway],
    exports: [AiGenerationService],
})
export class AiModule {}
