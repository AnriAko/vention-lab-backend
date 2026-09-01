import { Injectable } from '@nestjs/common';
import { Lexer, type Token, type Tokens } from 'marked';

import type { ParsedDocument, ParsedSection } from './markdown-parser.types';

@Injectable()
export class MarkdownParserService {
    parse(buffer: Buffer): ParsedDocument {
        const text = buffer.toString('utf8');
        const tokens = Lexer.lex(text);

        const sections = this.buildSections(tokens);

        if (sections.length === 0 && text.trim()) {
            sections.push({ text: text.trim() });
        }

        return { text, sections };
    }

    private buildSections(tokens: Token[]): ParsedSection[] {
        const sections: ParsedSection[] = [];
        let current: ParsedSection = { text: '' };

        const pushCurrent = () => {
            if (!current.heading && !current.text.trim()) {
                return;
            }

            sections.push({
                ...current,
                text: current.text.trim(),
            });
        };

        for (const token of tokens) {
            if (token.type === 'heading') {
                pushCurrent();
                const heading = token as Tokens.Heading;
                current = {
                    heading: heading.text,
                    level: heading.depth,
                    text: '',
                };
                continue;
            }

            current.text += this.tokenToText(token);
        }

        pushCurrent();

        return sections;
    }

    private tokenToText(token: Token): string {
        switch (token.type) {
            case 'paragraph':
            case 'text':
                return `${(token as Tokens.Paragraph | Tokens.Text).text}\n`;
            case 'code':
                return `\`\`\`${(token as Tokens.Code).lang ?? ''}\n${(token as Tokens.Code).text}\n\`\`\`\n`;
            case 'blockquote':
                return (token as Tokens.Blockquote).tokens
                    .map((nested) => this.tokenToText(nested))
                    .join('');
            case 'list': {
                const list = token as Tokens.List;
                return list.items
                    .map((item) => this.listItemToText(item))
                    .join('');
            }
            case 'space':
                return '\n';
            case 'hr':
                return '\n---\n';
            case 'html':
                return `${(token as Tokens.HTML).text}\n`;
            case 'table': {
                const table = token as Tokens.Table;
                const header = table.header
                    .map((cell) => cell.text)
                    .join(' | ');
                const rows = table.rows
                    .map((row) => row.map((cell) => cell.text).join(' | '))
                    .join('\n');

                return `${header}\n${rows}\n`;
            }
            default:
                if ('text' in token && typeof token.text === 'string') {
                    return `${token.text}\n`;
                }

                if ('tokens' in token && Array.isArray(token.tokens)) {
                    return (token.tokens as Token[])
                        .map((nested) => this.tokenToText(nested))
                        .join('');
                }

                return '';
        }
    }

    private listItemToText(item: Tokens.ListItem): string {
        const prefix = item.task ? `- [${item.checked ? 'x' : ' '}] ` : '- ';
        const nested = item.tokens
            .map((token) => this.tokenToText(token))
            .join('')
            .trim();

        return `${prefix}${nested}\n`;
    }
}
