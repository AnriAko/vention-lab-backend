import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

import type { ApiSuccessEnvelope } from '~/common/api/response/response.types';
import { requestContext } from '~/common/tenancy/request-context/request-context';

function isAlreadyWrapped(value: unknown): value is ApiSuccessEnvelope {
    return (
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        value.success === true &&
        'data' in value &&
        'timestamp' in value
    );
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        return next.handle().pipe(
            map((data) => {
                if (data instanceof StreamableFile || isAlreadyWrapped(data)) {
                    return data;
                }

                const store = requestContext.getStore();

                const envelope: ApiSuccessEnvelope = {
                    success: true,
                    requestId: store?.requestId,
                    timestamp: new Date().toISOString(),
                    data: data ?? null,
                };

                return envelope;
            })
        );
    }
}
