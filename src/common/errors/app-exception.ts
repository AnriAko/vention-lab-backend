import { HttpException } from '@nestjs/common';

export type AppErrorDefinition = {
    readonly code: string;
    readonly message: string;
    readonly statusCode: number;
};

export type AppExceptionOptions = {
    message?: string;
    details?: unknown;
};

export class AppException extends HttpException {
    readonly code: string;

    constructor(error: AppErrorDefinition, options?: AppExceptionOptions) {
        const message = options?.message ?? error.message;

        super(
            {
                message,
                errorCode: error.code,
                ...(options?.details !== undefined
                    ? { details: options.details }
                    : {}),
            },
            error.statusCode
        );

        this.code = error.code;
    }
}
