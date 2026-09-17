import { Module } from '@nestjs/common';

import { DocumentParserService } from './document-parser.service';
import { MarkdownParserService } from './markdown/markdown-parser.service';
import { PdfParserService } from './pdf/pdf-parser.service';

@Module({
    providers: [MarkdownParserService, PdfParserService, DocumentParserService],
    exports: [DocumentParserService],
})
export class ParsingModule {}
