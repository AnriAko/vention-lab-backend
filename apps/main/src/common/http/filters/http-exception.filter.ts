import {
    Catch,
    ExceptionFilter,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiErrorResponse } from '~/common/api/dto/error.response';
import { AppException } from '~/common/errors/app-exception';
import { CommonErrors } from '~/common/errors/common-errors';
import {
    isGraphqlHost,
    toGraphQLError,
} from '~/common/http/filters/to-graphql-error';
import { isWsContext } from '~/common/security/utils/execution-context';
import { requestContext } from '~/common/tenancy/request-context/request-context';
import { LoggerService } from '@vention/shared-logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: LoggerService) {}

    catch(exception: unknown, host: ArgumentsHost) {
        if (isGraphqlHost(host)) {
            const graphqlError = toGraphQLError(exception);
            this.logger.error(
                `[GRAPHQL ERROR] ${graphqlError.extensions.statusCode as number} ${String(graphqlError.extensions.code)} ${graphqlError.message}`
            );
            return graphqlError;
        }

        if (isWsContext(host)) {
            const message =
                exception instanceof Error
                    ? exception.message
                    : 'Unexpected error';

            this.logger.error(`[WS ERROR] ${message}`);
            return;
        }

        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const requestId = requestContext.getStore()?.requestId;
        const { message, errorCode, details } = this.resolveError(
            exception,
            status
        );

        this.logger.error(
            `[HTTP ERROR] ${req.method} ${req.originalUrl} ${status} ${errorCode} ${message}`
        );

        const body: ApiErrorResponse = {
            success: false,
            message,
            errorCode,
            requestId,
            timestamp: new Date().toISOString(),
            ...(details !== undefined ? { details } : {}),
        };

        res.status(status).json(body);
    }

    private resolveError(
        exception: unknown,
        status: number
    ): {
        message: string;
        errorCode: string;
        details?: unknown;
    } {
        if (exception instanceof AppException) {
            const response = exception.getResponse();
            const payload =
                typeof response === 'object' && response !== null
                    ? (response as Record<string, unknown>)
                    : {};

            return {
                message:
                    typeof payload.message === 'string'
                        ? payload.message
                        : exception.message,
                errorCode: exception.code,
                details: 'details' in payload ? payload.details : undefined,
            };
        }

        if (!(exception instanceof HttpException)) {
            return {
                message: CommonErrors.INTERNAL_ERROR.message,
                errorCode: CommonErrors.INTERNAL_ERROR.code,
            };
        }

        const response = exception.getResponse();
        let message = exception.message;
        let details: unknown;
        let errorCode = this.mapStatusToErrorCode(status);

        if (typeof response === 'string') {
            message = response;
        } else if (typeof response === 'object' && response !== null) {
            const payload = response as Record<string, unknown>;

            if (typeof payload.errorCode === 'string') {
                errorCode = payload.errorCode;
            }

            if (typeof payload.message === 'string') {
                message = payload.message;
            } else if (Array.isArray(payload.message)) {
                message = CommonErrors.VALIDATION_ERROR.message;
                errorCode = CommonErrors.VALIDATION_ERROR.code;
                details = payload.message;
            }

            if ('details' in payload) {
                details = payload.details;
            } else if (Array.isArray(payload.errors) && details === undefined) {
                details = payload.errors;
                errorCode = CommonErrors.VALIDATION_ERROR.code;
                if (typeof payload.message !== 'string') {
                    message = CommonErrors.VALIDATION_ERROR.message;
                }
            }
        }

        return {
            message,
            errorCode,
            details,
        };
    }

    private mapStatusToErrorCode(status: number): string {
        switch (status) {
            case HttpStatus.BAD_REQUEST:
                return CommonErrors.BAD_REQUEST.code;
            case HttpStatus.UNAUTHORIZED:
                return CommonErrors.UNAUTHORIZED.code;
            case HttpStatus.FORBIDDEN:
                return CommonErrors.FORBIDDEN.code;
            case HttpStatus.NOT_FOUND:
                return CommonErrors.NOT_FOUND.code;
            case HttpStatus.CONFLICT:
                return CommonErrors.CONFLICT.code;
            case HttpStatus.TOO_MANY_REQUESTS:
                return CommonErrors.RATE_LIMITED.code;
            case 422:
                return CommonErrors.VALIDATION_ERROR.code;
            default:
                return CommonErrors.INTERNAL_ERROR.code;
        }
    }
}
