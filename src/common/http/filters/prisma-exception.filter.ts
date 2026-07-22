import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '~/generated/prisma/client';

import { ApiErrorResponse } from '~/common/api';
import { CommonErrors } from '~/common/errors';
import { requestContext } from '~/common/tenancy';
import { LoggerService } from '~/infrastructure/logging';

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

        let status: number = CommonErrors.DATABASE_ERROR.statusCode;
        let message: string = CommonErrors.DATABASE_ERROR.message;
        let errorCode: string = CommonErrors.DATABASE_ERROR.code;

        switch (exception.code) {
            case 'P2025':
                status = HttpStatus.NOT_FOUND;
                message = 'Record not found';
                errorCode = CommonErrors.NOT_FOUND.code;
                break;

            case 'P2002':
                status = CommonErrors.UNIQUE_CONSTRAINT.statusCode;
                message = CommonErrors.UNIQUE_CONSTRAINT.message;
                errorCode = CommonErrors.UNIQUE_CONSTRAINT.code;
                break;

            case 'P2003':
                status = CommonErrors.FOREIGN_KEY_CONSTRAINT.statusCode;
                message = CommonErrors.FOREIGN_KEY_CONSTRAINT.message;
                errorCode = CommonErrors.FOREIGN_KEY_CONSTRAINT.code;
                break;
        }

        this.logger.error(
            `[PRISMA ERROR] ${req.method} ${req.originalUrl} ${exception.code} ${message}`
        );

        const body: ApiErrorResponse = {
            success: false,
            message,
            errorCode,
            requestId: requestContext.getStore()?.requestId,
            timestamp: new Date().toISOString(),
        };

        res.status(status).json(body);
    }
}
