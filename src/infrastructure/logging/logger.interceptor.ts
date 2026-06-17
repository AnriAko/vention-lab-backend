import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs';
import { Request, Response } from 'express';
import { LoggerService } from '~/infrastructure/logging/logger.service';

type Req = Request & {
    requestId?: string;
    startTime?: number;
};

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
    constructor(private readonly logger: LoggerService) {}

    intercept(context: ExecutionContext, next: CallHandler) {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest<Req>();
        const res = ctx.getResponse<Response>();

        const start = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - start;

                    if (!req.requestId) {
                        this.logger.warn(
                            `[HTTP] missing requestId ${req.method} ${req.originalUrl}`
                        );
                        return;
                    }

                    this.logger.log(
                        `[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
                    );
                },
                error: (err: unknown) => {
                    const duration = Date.now() - start;

                    const message =
                        err instanceof Error ? err.message : 'Unknown error';

                    if (!req.requestId) {
                        this.logger.error(
                            `[HTTP] missing requestId ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ${message}`
                        );
                        return;
                    }

                    this.logger.error(
                        `[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ${message}`
                    );
                },
            })
        );
    }
}
