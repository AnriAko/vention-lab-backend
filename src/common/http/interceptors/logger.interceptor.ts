import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Response } from 'express';
import {
    isGraphqlContext,
    isWsContext,
} from '~/common/security/utils/execution-context';
import { LoggerService } from '~/shared/logger';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
    constructor(private readonly logger: LoggerService) {}

    intercept(context: ExecutionContext, next: CallHandler) {
        const start = Date.now();

        if (isWsContext(context)) {
            return next.handle();
        }

        if (isGraphqlContext(context)) {
            const gqlContext = GqlExecutionContext.create(context);
            const info = gqlContext.getInfo<{ fieldName?: string }>();
            const operationName = info.fieldName ?? 'unknown';

            return next.handle().pipe(
                tap({
                    next: () => {
                        this.logger.log(
                            `[GraphQL] ${operationName} ${Date.now() - start}ms`
                        );
                    },
                    error: (err: unknown) => {
                        const message =
                            err instanceof Error
                                ? err.message
                                : 'Unknown error';

                        this.logger.error(
                            `[GraphQL] ${operationName} ERROR ${Date.now() - start}ms ${message}`
                        );
                    },
                })
            );
        }

        const http = context.switchToHttp();
        const req = http.getRequest<any>();
        const res = http.getResponse<Response>();
        const label = 'HTTP';

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
