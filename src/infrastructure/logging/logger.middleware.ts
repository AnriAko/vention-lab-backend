import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

//FIXME - include it inside global pipes

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(private readonly logger: LoggerService) {}

    use(req: Request, res: Response, next: NextFunction) {
        const startTime = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - startTime;

            const message =
                `${req.method} ${req.originalUrl} ` +
                `${res.statusCode} - ${duration}ms`;

            if (res.statusCode >= 500) {
                this.logger.error(message);
            } else {
                this.logger.log(message);
            }
        });

        next();
    }
}
