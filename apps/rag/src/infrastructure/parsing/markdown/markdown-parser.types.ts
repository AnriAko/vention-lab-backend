export type { ParsedDocument, ParsedSection } from '../parsed-document.types';

export enum MarkdownTokenType {
    Paragraph = 'paragraph',
    Text = 'text',
    Code = 'code',
    Blockquote = 'blockquote',
    List = 'list',
    Space = 'space',
    HorizontalRule = 'hr',
    Html = 'html',
    Table = 'table',
    Heading = 'heading',
}
