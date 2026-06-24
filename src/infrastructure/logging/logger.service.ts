import { Injectable } from '@nestjs/common';
import { winstonLogger } from './winston.config';

@Injectable()
export class LoggerService {
    log(message: string) {
        winstonLogger.info(message);
    }

    error(message: string, trace?: string) {
        winstonLogger.error(message, { stack: trace });
    }

    warn(message: string) {
        winstonLogger.warn(message);
    }

    debug(message: string) {
        winstonLogger.debug(message);
    }
}
