import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from '~/common/errors/app-exception';

export const FileErrors = {
    NOT_FOUND: {
        code: 'FILE_NOT_FOUND',
        message: 'File not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
    REQUIRED: {
        code: 'FILE_REQUIRED',
        message: 'File is required',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    EMPTY: {
        code: 'FILE_EMPTY',
        message: 'Empty files are not allowed',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    TOO_LARGE: {
        code: 'FILE_TOO_LARGE',
        message: 'File exceeds the maximum allowed size',
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
    },
    INVALID_TYPE: {
        code: 'FILE_INVALID_TYPE',
        message: 'File type is not allowed',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    INVALID_EXTENSION: {
        code: 'FILE_INVALID_EXTENSION',
        message: 'File extension is not allowed',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    TYPE_MISMATCH: {
        code: 'FILE_TYPE_MISMATCH',
        message: 'File MIME type does not match its extension',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    STORAGE_ERROR: {
        code: 'FILE_STORAGE_ERROR',
        message: 'Failed to store file',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    },
    INVALID_ENCODING: {
        code: 'FILE_INVALID_ENCODING',
        message: 'File encoding is invalid or unsupported',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    INFECTED: {
        code: 'FILE_INFECTED',
        message: 'File failed antivirus scan',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    },
    AV_UNAVAILABLE: {
        code: 'FILE_AV_UNAVAILABLE',
        message: 'Antivirus service is unavailable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    },
    PROCESSING_IN_PROGRESS: {
        code: 'FILE_PROCESSING_IN_PROGRESS',
        message: 'File cannot be deleted while it is being processed',
        statusCode: HttpStatus.CONFLICT,
    },
} as const satisfies Record<string, AppErrorDefinition>;
