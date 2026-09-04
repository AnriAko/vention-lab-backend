export type ParsedSection = {
    heading?: string;
    level?: number;
    text: string;
};

export type ParsedDocument = {
    text: string;
    sections: ParsedSection[];
};
