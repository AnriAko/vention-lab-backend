import { Injectable } from '@nestjs/common';

import { MarkdownParserService } from './markdown/markdown-parser.service';
import type { ParsedDocument } from './parsed-document.types';
import { PdfParserService } from './pdf/pdf-parser.service';

export class UnsupportedDocumentFormatError extends Error {
    constructor(extension: string) {
        super(`Unsupported file extension: .${extension}`);
        this.name = 'UnsupportedDocumentFormatError';
    }
}

@Injectable()
export class DocumentParserService {
    constructor(
        private readonly markdownParser: MarkdownParserService,
        private readonly pdfParser: PdfParserService
    ) {}

    async parse(buffer: Buffer, extension: string): Promise<ParsedDocument> {
        if (extension === 'md') {
            return this.markdownParser.parse(buffer);
        }

        if (extension === 'pdf') {
            return this.pdfParser.parse(buffer);
        }

        throw new UnsupportedDocumentFormatError(extension);
    }
}
