import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiGateway } from './ai.gateway';
import { AiService } from './ai.service';

@Module({
    controllers: [AiController],
    providers: [AiService, AiGateway],
    exports: [AiService],
})
export class AiModule {}
