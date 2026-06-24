import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

type Req = Request & {
    requestId?: string;
    startTime?: number;
};

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Req, res: Response, next: NextFunction) {
        const requestId = crypto.randomUUID();

        req.requestId = requestId;
        req.startTime = Date.now();

        res.setHeader('x-request-id', requestId);

        next();
    }
}
