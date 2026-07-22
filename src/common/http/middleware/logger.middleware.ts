import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from '~/common/tenancy';
import { AUTH_GUEST } from '~/common/security';

type Req = Request & {
    requestId?: string;
};

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Req, res: Response, next: NextFunction) {
        const requestId = randomUUID();
        const startTime = Date.now();

        res.setHeader('x-request-id', requestId);

        requestContext.run(
            {
                requestId,
                startTime,
                userId: AUTH_GUEST,
            },
            () => next()
        );
    }
}
