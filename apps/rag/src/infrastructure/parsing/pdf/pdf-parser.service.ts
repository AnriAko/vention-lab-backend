import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';

import type { ParsedDocument } from '../parsed-document.types';

@Injectable()
export class PdfParserService {
    async parse(buffer: Buffer): Promise<ParsedDocument> {
        const result = await pdfParse(buffer);
        const text = result.text.trim();

        if (!text) {
            return { text: '', sections: [] };
        }

        return {
            text,
            sections: [{ text }],
        };
    }
}
