import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

import { AppException } from '~/common/errors/app-exception';
import { CommonErrors } from '~/common/errors/common-errors';

export function isGraphqlHost(host: ArgumentsHost): boolean {
    return host.getType<GqlContextType>() === 'graphql';
}

export function toGraphQLError(exception: unknown): GraphQLError {
    if (exception instanceof GraphQLError) {
        return exception;
    }

    if (exception instanceof AppException) {
        const response = exception.getResponse();
        const payload =
            typeof response === 'object' && response !== null
                ? (response as Record<string, unknown>)
                : {};

        return new GraphQLError(
            typeof payload.message === 'string'
                ? payload.message
                : exception.message,
            {
                extensions: {
                    code: exception.code,
                    statusCode: exception.getStatus(),
                    ...(payload.details !== undefined
                        ? { details: payload.details }
                        : {}),
                },
            }
        );
    }

    if (exception instanceof HttpException) {
        const response = exception.getResponse();
        const payload =
            typeof response === 'object' && response !== null
                ? (response as Record<string, unknown>)
                : {};

        return new GraphQLError(
            typeof payload.message === 'string'
                ? payload.message
                : exception.message,
            {
                extensions: {
                    code:
                        typeof payload.errorCode === 'string'
                            ? payload.errorCode
                            : CommonErrors.INTERNAL_ERROR.code,
                    statusCode: exception.getStatus(),
                    ...(payload.details !== undefined
                        ? { details: payload.details }
                        : {}),
                },
            }
        );
    }

    return new GraphQLError(CommonErrors.INTERNAL_ERROR.message, {
        extensions: {
            code: CommonErrors.INTERNAL_ERROR.code,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
    });
}
