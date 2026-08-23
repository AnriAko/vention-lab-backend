export const FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const COMPRESSED_STORAGE_SUFFIX = '.gz';

export const FILE_ENCODING_HEADER = 'x-file-encoding';

export const FILE_ENCODING_GZIP = 'gzip';

export const ALLOWED_FILE_TYPES = {
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
    ],
    // 'application/pdf': ['.pdf'],
    // 'text/markdown': ['.md'],
} as const satisfies Record<string, readonly string[]>;

export type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;

export const ALLOWED_MIME_TYPES = Object.keys(
    ALLOWED_FILE_TYPES
) as AllowedMimeType[];

export const ALLOWED_EXTENSIONS = [
    ...new Set(Object.values(ALLOWED_FILE_TYPES).flat()),
] as string[];
