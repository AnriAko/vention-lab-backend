import {
    Catch,
    ExceptionFilter,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '~/infrastructure/logging/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: LoggerService) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof Error ? exception.message : 'Unknown error';

        this.logger.error(
            `[HTTP ERROR] ${req.method} ${req.originalUrl} ${status} ${message}`
        );

        res.status(status).json({
            statusCode: status,
            path: req.originalUrl,
            message,
        });
    }
}
