import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs';
import { Response } from 'express';
import { LoggerService } from '~/infrastructure/logging/logger.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
    constructor(private readonly logger: LoggerService) {}

    intercept(context: ExecutionContext, next: CallHandler) {
        const http = context.switchToHttp();
        const req = http.getRequest<any>();
        const res = http.getResponse<Response>();
        const label = 'HTTP';
        const start = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - start;

                    this.logger.log(
                        `[${label}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
                    );
                },
                error: (err: unknown) => {
                    const duration = Date.now() - start;

                    const message =
                        err instanceof Error ? err.message : 'Unknown error';

                    this.logger.error(
                        `[${label}] ${req.method} ${req.originalUrl} ERROR ${duration}ms ${message}`
                    );
                },
            })
        );
    }
}
