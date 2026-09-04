import { Module } from '@nestjs/common';

import { MarkdownParserService } from './markdown/markdown-parser.service';

@Module({
    providers: [MarkdownParserService],
    exports: [MarkdownParserService],
})
export class ParsingModule {}
