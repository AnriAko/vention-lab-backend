import { Module } from '@nestjs/common';

import { ChunkingService } from './chunking.service';
import { FixedSizeChunkingStrategy } from './fixed-size-chunking.strategy';
import { MarkdownChunkingStrategy } from './markdown-chunking.strategy';

@Module({
    providers: [
        FixedSizeChunkingStrategy,
        MarkdownChunkingStrategy,
        ChunkingService,
    ],
    exports: [ChunkingService],
})
export class ChunkingModule {}
