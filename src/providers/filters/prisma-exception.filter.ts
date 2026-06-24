import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '~/generated/prisma/client';
import { LoggerService } from '~/infrastructure/logging/logger.service';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter {
    constructor(private readonly logger: LoggerService) {}

    catch(
        exception: Prisma.PrismaClientKnownRequestError,
        host: ArgumentsHost
    ) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database error';

        switch (exception.code) {
            case 'P2025':
                status = HttpStatus.NOT_FOUND;
                message = 'Record not found';
                break;

            case 'P2002':
                status = HttpStatus.CONFLICT;
                message = 'Unique constraint failed';
                break;

            case 'P2003':
                status = HttpStatus.BAD_REQUEST;
                message = 'Foreign key constraint failed';
                break;
        }

        this.logger.error(
            `[PRISMA ERROR] ${req.method} ${req.originalUrl} ${exception.code} ${message}`
        );

        res.status(status).json({
            statusCode: status,
            path: req.originalUrl,
            message,
        });
    }
}
