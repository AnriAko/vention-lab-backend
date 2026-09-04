import { HttpStatus } from '@nestjs/common';

import type { AppErrorDefinition } from '~/common/errors/app-exception';

export const ChatErrors = {
    NOT_FOUND: {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
    ALREADY_EXISTS: {
        code: 'CHAT_ALREADY_EXISTS',
        message: 'A chat with this user already exists',
        statusCode: HttpStatus.CONFLICT,
    },
    CANNOT_CHAT_WITH_SELF: {
        code: 'CHAT_CANNOT_CHAT_WITH_SELF',
        message: 'Cannot create a chat with yourself',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    USER_NOT_IN_ORGANIZATION: {
        code: 'CHAT_USER_NOT_IN_ORGANIZATION',
        message: 'User does not belong to the organization',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    MEMBER_LIMIT_REACHED: {
        code: 'CHAT_MEMBER_LIMIT_REACHED',
        message: 'Chat can contain only 2 members',
        statusCode: HttpStatus.BAD_REQUEST,
    },
    ALREADY_MEMBER: {
        code: 'CHAT_ALREADY_MEMBER',
        message: 'User already belongs to this chat',
        statusCode: HttpStatus.CONFLICT,
    },
    MEMBER_NOT_FOUND: {
        code: 'CHAT_MEMBER_NOT_FOUND',
        message: 'User does not belong to this chat',
        statusCode: HttpStatus.NOT_FOUND,
    },
    MESSAGE_NOT_FOUND: {
        code: 'CHAT_MESSAGE_NOT_FOUND',
        message: 'Message not found',
        statusCode: HttpStatus.NOT_FOUND,
    },
    MESSAGE_DELETE_FORBIDDEN: {
        code: 'CHAT_MESSAGE_DELETE_FORBIDDEN',
        message: 'Only the sender can delete this message',
        statusCode: HttpStatus.FORBIDDEN,
    },
} as const satisfies Record<string, AppErrorDefinition>;
