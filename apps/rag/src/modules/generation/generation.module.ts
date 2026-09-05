import { Module } from '@nestjs/common';

import { GenerationGateway } from './generation.gateway';

@Module({
    providers: [GenerationGateway],
})
export class GenerationModule {}
